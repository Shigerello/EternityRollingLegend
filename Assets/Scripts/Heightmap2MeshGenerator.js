#pragma strict

// プロシージャル・メッシュの作成はMeshFilterを必要とする。
@script RequireComponent(MeshFilter)
// Playモードじゃなくともこのスクリプトが走る様にする。UpdateやOnGUIなどの挙動が通常と変わるので、
// 詳しくはオフィシャル・リファレンスを参照の事：
// http://docs.unity3d.com/Documentation/ScriptReference/ExecuteInEditMode.html
@script ExecuteInEditMode()

/*!
 * @brief Heightmapからメッシュを生成するユーティリティ・クラス
 */
static public class Heightmap2MeshGenerator extends MonoBehaviour {
    public var heightmap : Texture2D;
    public var boundingBoxDst = Vector3(36, 36, 36);
    // 生成されるメッシュが持つxy軸毎の辺の数。数値を大きくすれば頂点数（軸毎に辺の数+1）の多い滑ら
    // かなメッシュを生成できる。しかし、生成元のheightmapテクスチャの縦横ピクセル数を超える様な値
    // は極端にリソース・コストを上げるだけで見返りが少なくなるということに注意（反面、高粒度の
    // heightmapテクスチャを用意すれば良いと云う話でもある）。
    public var edgeQuantize = Vector2(127, 127);
    // Heightmapが保持されたカラーチャンネル（RGBもしくはGrayscale）
    public var heightmapChannel : String = "red";
    
    public var startPos : Vector3;
    public var finishPos : Vector3;
    
    function GenerateHightmapMesh() : GameObject
    {
        return GenerateHightmapMesh(null);
    }
    
    function GenerateHightmapMesh(otherHeightmap : Texture2D) : GameObject
    {
        // ロジックチェック
        var tmpHeightmap = heightmap ? heightmap : (otherHeightmap ? otherHeightmap : null);
        if (!tmpHeightmap) {
            DebugTool.LogErrorAndExit("Heightmap texture is needed, but it is not given.");
        }
        if (tmpHeightmap.format != TextureFormat.ARGB32 &&
            tmpHeightmap.format != TextureFormat.RGBA32) {
            DebugTool.LogErrorAndExit("Heightmap texture's format must be ARGB32 or RGA32.");
        }
        
        // GetComponentはComponentのアタッチ先となるGameObjectが必要。最終的にこのGameObjectを
        // 返す。
        // 回転はメッシュのピボット周りで行われるが、それを変更できない（！）。代案として、メッシュ
        // を別のGameObjectの子GameObjectとし、その親GameObjectに対して回転をかける：子と親の相対関
        // 係に応じて子GameObjectであるメッシュのピボットが変えられる。
        var myMesh = new GameObject();
        myMesh.name = "GeneratedMesh (" + tmpHeightmap.name + ")";
        myMesh.transform.position = Vector3.zero;
        var myMeshChild = new GameObject();
        myMeshChild.name = "GeneratedMesh child (" + tmpHeightmap.name + ")";
        myMeshChild.transform.parent = myMesh.transform;
        // myMeshChildの上面中央を回転ピボットにする。
        myMeshChild.transform.position = Vector3(-boundingBoxDst.x/2.0,
                                                 boundingBoxDst.y,
                                                 -boundingBoxDst.z/2.0);
        
        // 新規メッシュを取得（MeshFilterはmeshプロパティへの初回アクセス時には空の新規Meshを返すが
        // 2回目以降は初回に新規作成したMeshのコピーを返すので、Clear()しないと危険）。
        var mesh : Mesh = myMeshChild.AddComponent(MeshFilter).mesh;
        mesh.Clear();
        
        // メッシュ・レンダラを追加；これでmyMeshChildはレンダリングの対象になる。
//        var meshRenderer = myMeshChild.AddComponent(MeshRenderer);
//        meshRenderer.material = new Material(Shader.Find("Diffuse"));
        
        // Rigidbodyを追加。
        var rigidbody = myMeshChild.AddComponent(Rigidbody);
        rigidbody.useGravity = false;
        rigidbody.constraints = RigidbodyConstraints.FreezeAll;
        
        // メッシュ・コライダを追加；これでmyMeshChildは衝突判定の対象になる。
        myMeshChild.AddComponent(MeshCollider);
        
        // 2次元画像のX軸（横、horizontal）は3DではX軸（横）
        var vtxCountX : int = edgeQuantize.x + 1;
        // 2次元画像のY軸（縦、vertical）は3DではZ軸（奥行き）
        var vtxCountZ : int = edgeQuantize.y + 1;
        
        // 頂点座標・UV座標・接ベクトルのコンテナを用意。
        var vertices = new Vector3[vtxCountZ * vtxCountX];
        var uv = new Vector2[vtxCountZ * vtxCountX];
        var tangents = new Vector4[vtxCountZ * vtxCountX];
        // メッシュの3角切片のコンテナを用意；3角切片毎に頂点座標コンテナのインデックスを3つ取る。
        var triangles = new int[(vtxCountZ - 1) * (vtxCountX - 1) * 6];
        // 2次元画像のx軸は3Dのx軸に、y軸はz軸に対応。カラーチャンネル（heightmap）はy軸に対応。
        var boundingBoxSrc = Vector3(tmpHeightmap.width - 1,
                                     256 /*赤チャンネルの深度*/ - 1,
                                     tmpHeightmap.height - 1);
        // 座標変換：量子化(Quantize) xyz座標.Scale(deltaQnt2Src) -> heightmap (Source)のxyz座標
        var deltaQnt2Src = Vector3.Scale(boundingBoxSrc,
                                         Vector3(1.0/edgeQuantize.x,
                                                 1.0/boundingBoxSrc.y,
                                                 1.0/edgeQuantize.y)
                                         );
        // 座標変換：heightmap (Source)のxyz座標.Scale(deltaSrc2Dst) -> mesh (Destination)のxyz座標
        // 色の赤コンポーネントが大きいほど、yが低くなる様に符号を反転。
        var deltaSrc2Dst = Vector3.Scale(boundingBoxDst,
                                         Vector3(1.0/boundingBoxSrc.x,
                                                 -1.0/boundingBoxSrc.y,
                                                 1.0/boundingBoxSrc.z)
                                         );
        // 座標変換：量子化(Quantize) xyz座標.Scale(deltaQnt2Src) -> meshのuv座標
        var deltaQnt2UV = Vector2(1.0 / edgeQuantize.x,
                                  1.0 / edgeQuantize.y);
        
        // heightmapテクスチャの全ピクセルを取得。
        var pixels = tmpHeightmap.GetPixels32();
        
        var index = 0;
        var x : int;
        var z : int;
        var posSrc : Vector3;
        
        // ピクセルからheightmap値を取り出す関数；どのカラーチャンネルから値を取得するのか分岐。
        var QueryColor : function(int,int) : float;
        switch (heightmapChannel) {
            case "grayscale":
                QueryColor = function(x:int, y:int) : float {
                    // Color32 -> Color変換（grayscale値取得がColor32には提供されていないため）
                    var tmp : Color = pixels[y*tmpHeightmap.width + x];
                    return tmp.grayscale*255;
                };
                break;
            case "red":
                QueryColor =  function(x:int, y:int) : byte {
                    var tmp : int = pixels[y*tmpHeightmap.width + x].r;
                    return tmp;
                };
                break;
            case "green":
                QueryColor =  function(x:int, y:int) : byte {
                    return pixels[y*tmpHeightmap.width + x].g;
                };
                break;
            case "blue":
                QueryColor =  function(x:int, y:int) : byte {
                    return pixels[y*tmpHeightmap.width + x].b;
                };
                break;
            default:
                DebugTool.LogErrorAndExit("Color channel \"" + heightmapChannel + "\" is invalid; choose from \"red\", \"green\", \"blue\", or \"grayscale\".");
        }
        
        // 頂点毎のメッシュデータを計算する関数。
        // 定義された場所の変数スコープを引き継いだ匿名関数（C#のdelegateやFuncを参照）。変数を参照
        // できる様にする為に変数をグローバルにしたり、引数に渡す必要が無くて便利。
        var CalcPerVertexData : Function
        = function()
        {
            // Heightmap (Source)のxy座標を取得。
            posSrc = Vector3(deltaQnt2Src.x*x, 0, deltaQnt2Src.z*z);
            // Heightmap (Source)の高さ（y座標）を取得。
            posSrc.y = deltaQnt2Src.y*QueryColor(posSrc.x, posSrc.z);
            
            // Mesh (Destination)のxyz座標を取得。
            vertices[z*vtxCountX + x] = Vector3.Scale(posSrc, deltaSrc2Dst);
            
            // UV座標を取得
            uv[z*vtxCountX + x] = Vector2.Scale(deltaQnt2UV, Vector2(x, z));
            
            // 接ベクトル（x軸に沿って現頂点の後ろの頂点から前の頂点を結ぶベクトル）を取得
            // 生成するメッシュにBumpmuppingシェーダを用いるのであれば、接ベクトルが必要となる。
            var posSrcL = Vector3(deltaQnt2Src.x*(x-1), 0, deltaQnt2Src.z*z);
            posSrcL = Vector3.Min(posSrcL, boundingBoxSrc);
            posSrcL = Vector3.Max(posSrcL, Vector3.zero);
            posSrcL.y = deltaQnt2Src.y*QueryColor(posSrcL.x, posSrcL.z);
            var posSrcR = Vector3(deltaQnt2Src.x*(x+1), 0, deltaQnt2Src.z*z);
            posSrcR = Vector3.Min(posSrcR, boundingBoxSrc);
            posSrcR = Vector3.Max(posSrcR, Vector3.zero);
            posSrcR.y = deltaQnt2Src.y*QueryColor(posSrcR.x, posSrcR.z);
            var tan = (posSrcR - posSrcL).normalized;
            tangents[z*vtxCountX + x] = Vector4(tan.x, tan.y, tan.z, -1.0);
        };
        
        // メッシュの3角切片を計算する関数。
        // 定義された場所の変数スコープを引き継いだ匿名関数（C#のdelegateやFuncを参照）。変数を参照
        // できる様にする為に変数をグローバルにしたり、引数に渡す必要が無くて便利。
        var CalcTris : Function
        = function()
        {
            var zStride = z * vtxCountX;
            // メッシュ上の4角切片毎に2つの3角切片が得られる。
            triangles[index++] = zStride - vtxCountX + x - 1;
            triangles[index++] = zStride + x - 1;
            triangles[index++] = zStride - vtxCountX + x;
            
            triangles[index++] = zStride + x - 1;
            triangles[index++] = zStride + x;
            triangles[index++] = zStride - vtxCountX + x;
        };
        
        // メッシュデータを計算。
        // 2次元画像のY軸（縦、vertical）は3DではZ軸（奥行き）
        // 2次元画像のX軸（横、horizontal）は3DではX軸（横）
        //
        // メモ化アルゴリズム：CalcTris()は(x,z)の頂点に加え、(x-1,z)(x,z-1)(x-1,z-1)の頂点も参照す
        // るので、CalcTris()を行う前に必要な頂点を計算しておく。
        // ### CalcTeris()の実行時から相対的に見て、頂点(x,z-1)(x-1,z-1)の計算 ###
        for (z = 0; z < 1; ++z)
        {
            for (x = 0; x < vtxCountX - 1; ++x)
            {
                CalcPerVertexData();
            }
        }
        for (z = 1; z < vtxCountZ - 1; ++z)
        {
            // ### CalcTeris()の実行時から相対的に見て、頂点(x-1,z)の計算 ###
            x = 0;
            CalcPerVertexData();
            for (x = 1; x < vtxCountX - 1; ++x)
            {
                // ### CalcTeris()の実行時から相対的に見て、頂点(x,z)の計算 ###
                CalcPerVertexData();
                // このCalcTeris()の実行時、既に頂点(x,z)(x-1,z)(x,z-1),(x-1,z-1)は計算済み。
                CalcTris();
            }
        }
        
        // 各種メッシュデータを割り当てる。
        mesh.vertices = vertices;
        mesh.uv = uv;
        mesh.triangles = triangles;
        
        // 頂点法線を再計算後、接ベクトルを割り当てる。
        mesh.RecalculateNormals();
        mesh.tangents = tangents;
        
        // 三角切片の最適化（ジオメトリを変化させない無駄な頂点を削るなどの頂点最適化はムズい）。
        mesh.Optimize();
        
        return myMesh;
    }
}
