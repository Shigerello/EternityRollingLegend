#pragma strict

import System.Collections.Generic;

public class DebugTool extends MonoBehaviour
{
    static function LogErrorAndExit(message)
    {
        // システム由来のLogErrorメッセージと区別するため、文頭を修飾する。
        Debug.LogError("#DebugTool# " + message);
        #if UNITY_EDITOR
            EditorApplication.ExecuteMenuItem("Edit/Pause");
        #else
            Application.Quit();
        #endif
    }
}

// Unityコンポーネントとしてアクセスできる変数の必要条件はUnityのObjectクラスを継承していること。C#
// のDictionaryはそれを満たしていないので、UnityのObjectでラッピングする事で外部にUnityコンポーネン
// トとして認識させる。
// 又、表示させる値の型の違いをvarは吸収しない（var foo : SomeClassにOtherClass型の値を代入するとエ
// ラーが出るとか、JSじゃなくまさしくC#の挙動）ので、表示させたい値を返り値とする匿名関数（Function
// 型）を代わりに渡す。
// GenericなクラスはUnityScriptだと記述できないみたいなので、そこはC#で書かないとダメっぽい。
//
// !!! UnityScript & C# 混在コード !!!
public class UnityDictionary extends Object
{
    public var dictionary : Dictionary.<String, Function> = new Dictionary.<String, Function>();
    
    function SafeQuery(query : String) : Function
    {
        // 存在しないキーには空文字列を返り値とする関数を渡す（NullReferenceException対策）。
        return dictionary.ContainsKey(query) ? dictionary[query] : function() {return "";};
    }
};

var watchVars : UnityDictionary = new UnityDictionary();

private var scrollPosition = Vector2.zero;

function Awake() {
    watchVars.dictionary["Screen rect"] = function() {
        return "(" + Screen.width + ", " + Screen.height + ")";
    };
}

function OnGUI() {
    DisplayWatchVars();
}

function DisplayWatchVars() {
    var message : String;
    for (var key in watchVars.dictionary.Keys) {
        message += key + ": " + (watchVars.dictionary[key] as Function)()+ "\n";
    }
    
    scrollPosition = GUILayout.BeginScrollView(scrollPosition, GUILayout.Width(Screen.width), GUILayout.Height(Screen.height*0.1));
    
    GUILayout.Label(message);
    
    GUILayout.EndScrollView();
}