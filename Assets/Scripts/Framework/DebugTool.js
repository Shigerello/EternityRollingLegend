#pragma strict

import System.Collections.Generic;

// Unityコンポーネントとしてアクセスできる変数の必要条件はUnityのObjectクラスを継承していること。C#
// のDictionaryはそれを満たしていないので、UnityのObjectでラッピングする事で外部にUnityコンポーネン
// トとして認識させる。
// 又、表示させる値の型の違いをvarは吸収しない（var foo : SomeClassにOtherClass型の値を代入するとエ
// ラーが出るとか、JSじゃなくまさしくC#の挙動）ので、表示させたい値を返り値とする匿名関数（Function
// 型）を代わりに渡す。
// GenericなクラスはUnityScriptだと記述できないみたいなので、そこはC#で書かないとダメっぽい。
public class UnityDictionary extends Object
{
    public var dictionary : Dictionary.<String, Function> = new Dictionary.<String, Function>();
    
    function SafeQuery(query : String) : Function
    {
        // 存在しないキーには空文字列を返り値とする関数を渡す（NullReferenceException対策）。
        return dictionary.ContainsKey(query) ? dictionary[query] : function() {return "";};
    }
};

// TODO: DebugToolとDebugToolProxyをSingletonで一纏めにする。
class DebugToolProxy extends MonoBehaviour
{
    function OnGUI() {
        DebugTool._DisplayWatchVars();
        Test();
    }
    
    function Test() {
        DebugTool.RegisterWatchVars("Screen rect",
                                    function() "(" + Screen.width + ", " + Screen.height + ")"
                                    );
        DebugTool.RegisterWatchVars("Input.GetAxis(\"Horizontal\")",
                                    function() Input.GetAxis("Horizontal")
                                    );
        DebugTool.RegisterWatchVars("Input.GetAxis(\"Vertical\")",
                                    function() Input.GetAxis("Vertical")
                                    );
        DebugTool.RegisterWatchVars("Input.GetAxis(\"Fire1\")",
                                    function() Input.GetAxis("Fire1")
                                    );
        DebugTool.RegisterWatchVars("Input.GetAxis(\"Fire2\")",
                                    function() Input.GetAxis("Fire2")
                                    );
        DebugTool.RegisterWatchVars("Input.GetAxis(\"Fire3\")",
                                    function() Input.GetAxis("Fire3")
                                    );
        DebugTool.RegisterWatchVars("Input.GetAxis(\"Jump\")",
                                    function() Input.GetAxis("Jump")
                                    );
        DebugTool.RegisterWatchVars("Input.GetAxis(\"Mouse X\")",
                                    function() Input.GetAxis("Mouse X")
                                    );
        DebugTool.RegisterWatchVars("Input.GetAxis(\"Mouse Y\")",
                                    function() Input.GetAxis("Mouse Y")
                                    );
        DebugTool.RegisterWatchVars("Input.GetAxis(\"Mouse ScrollWheel\")",
                                    function() Input.GetAxis("Mouse ScrollWheel")
                                    );
    }
}

static public class DebugTool extends MonoBehaviour
{
    var watchVars : UnityDictionary = new UnityDictionary();
    private var proxy : GameObject;
    private var scrollPosition = Vector2.zero;
    
    /// エラーログを出力してアプリケーションを一時停止させる。
    function LogErrorAndExit(message)
    {
        // システム由来のLogErrorメッセージと区別するため、文頭を修飾する。
        Debug.LogError("#DebugTool# " + message);
        PauseStart();
    }
    
#if UNITY_EDITOR
    // フレーム更新を一時停止させる。フレームが更新されないだけで一部のコードや内部処理は動き続ける
    // ので注意。
    function PauseStart() {
        EditorApplication.isPaused = true;
    }
    // フレーム更新を再開する。
    function PauseEnd() {
        EditorApplication.isPaused = false;
    }
#else
    private var oldTimeScale;
    function PauseStart() {
        if (Time.timeScale != 0) {
            oldTimeScale = Time.timeScale;
            Time.timeScale = 0;
        }
    }
    function PauseEnd() {
        if (Time.timeScale == 0) {
            Time.timeScale = oldTimeScale;
        }
    }
#endif
    
    function RegisterWatchVars(name : String, messageDelegate : Function ) {
        watchVars.dictionary[name] = messageDelegate;
    }
    
    function DisplayWatchVars() {
        // _DisplayWatchVars()をOnGUIで呼び出してくれる代行者（proxy）を用意。
        proxy = GameObject.Find("DebugToolProxy");
        if (!proxy) {
            proxy = new GameObject();
            proxy.AddComponent(DebugToolProxy);
            proxy.name = "DebugToolProxy";
            // Sceneの切り替え時に解放されない様にする。
            UnityEngine.Object.DontDestroyOnLoad(proxy);
        }
    }
    
    // これを直接呼び出さずに、代わりにDisplayWatchVars() を呼ぶ事。
    function _DisplayWatchVars() {
        var message : String;
        for (var key in watchVars.dictionary.Keys) {
            message += key + ": " + (watchVars.dictionary[key] as Function)()+ "\n";
        }
        
        scrollPosition = GUILayout.BeginScrollView(scrollPosition, GUILayout.Width(Screen.width), GUILayout.Height(Screen.height*0.1));
        
        GUILayout.Label(message);
        
        GUILayout.EndScrollView();
    }
}
