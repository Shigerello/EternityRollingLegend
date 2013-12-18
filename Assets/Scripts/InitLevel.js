#pragma strict

// レベル生成用Heightmapテクスチャ
public var levelHeightmap : Texture2D;
// Heightmap => メッシュ生成器
private var meshGenerator : Heightmap2MeshGenerator;

//
public var floorTexture : Texture2D;
private var floor : GameObject;

// プレイヤー
public var playerPrefab : GameObject;
private var player : GameObject;

function Start() {
    // ロジックチェック
    if (!playerPrefab)
        DebugTool.LogErrorAndExit("Player prefab is not specified!");
    if (!levelHeightmap)
        DebugTool.LogErrorAndExit("Heightmap texture is not specified!");
    
    // プレイヤーを生成
    player = Instantiate(playerPrefab, Vector3.up*10, Quaternion.identity);
    
    // 追跡カメラのターゲットをplayerに設定
//    var followingObject : FollowingObject = GameObject.Find("Follow Camera").GetComponent(FollowingObject);
//    followingObject._TargetGameObject = player;
    
    // Heightmapから衝突メッシュを生成
    meshGenerator = GetComponent(Heightmap2MeshGenerator);
    var myMesh : GameObject = meshGenerator.GenerateHightmapMesh(levelHeightmap);
    myMesh.AddComponent(TiltInput);
    player.transform.parent = myMesh.transform;

//    DebugTool.LogErrorAndExit("mesh bounds: " + myMesh.bounds);
    
    //
    floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
    var shader = Shader.Find("Mobile/Diffuse");
    floor.renderer.material.mainTexture = floorTexture;
    floor.transform.position = Vector3.zero;
    floor.transform.eulerAngles = Vector3(0, 180, 0);
    floor.transform.localScale = Vector3(3.6,1,3.6);
    floor.transform.parent = myMesh.transform;
    
//    var envBox = GameObject.Find("EnvBox");
//    envBox.AddComponent(TiltInput);
//    player.transform.parent = envBox.transform;
}
