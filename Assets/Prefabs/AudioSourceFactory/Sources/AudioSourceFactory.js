/*!
 サウンドをデータベース
 */

#pragma strict

// デバッグ用
#if UNITY_DEBUG
private var watchVars : UnityDictionary;
#endif

function Awake() {
    // デバッグ用
#if UNITY_DEBUG
    watchVars = GameObject.Find("DebugTool").GetComponent(DebugTool).watchVars;
#endif
}

// このAudioSourceFactory上で指定されたAudioClipを保持したAudioSource、そしてそのAudioSourceを保持
// した新規のGameObjectを
function Create(position : Vector3) : Function {
    // このスクリプトをコンポーネントとして持つAudioSourceFactoryが持つAudioSource（Editor上で設定
    // を弄れる）を、設定をそのままに再利用する。
    var audioSource = gameObject.GetComponent(AudioSource);
    if (audioSource == null) {
        DebugTool.LogErrorAndExit("This AudioSourceFactory instance was corrupted; AudioSourceFactory perfabs (including renamed ones) must have an AudioSource component, regenerate this prefab from the original.");
    } else if (audioSource.clip == null) {
        DebugTool.LogErrorAndExit("This AudioSourceFactory instance does not have an audio clip. Attach it.");
    }
    // 用が済み次第破棄するGameObjectを用意。
    var tmpGameObject : GameObject = new GameObject();
    tmpGameObject.transform.position = position;
    
    return function() {
        // デバッグ用
#if UNITY_DEBUG
        var clipStr = audioSource.clip.ToString();
        var clipLen = audioSource.clip.length;
        var clipPos = tmpGameObject.transform.position;
        watchVars.dictionary["Audio clip"] = function() {
            return clipStr + " (length: " + clipLen + ")";
        };
        watchVars.dictionary["Position of last audio source"] = function() {
            return clipPos;
        };
#endif
        audioSource.Play();
        // オーディオクリップの長さが経ったら（再生を終えたら）、一時GameObjectを破棄。
        Destroy(tmpGameObject, audioSource.clip.length);
    };
}
