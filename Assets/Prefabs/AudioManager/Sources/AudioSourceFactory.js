/*!
 サウンドをデータベース
 */

#pragma strict

import Utility;

function Awake() {
}

// このAudioSourceFactory上で指定されたAudioClipを保持したAudioSource、そしてそのAudioSourceを保持
// した新規のGameObjectを
function Create(position : Vector3, volume:float, pitchDeviation:float) : Function {
    // このスクリプトをコンポーネントとして持つAudioSourceFactoryが持つAudioSource（Editor上で設定
    // を弄れる）を、設定をそのままに再利用する。
    var audioSource : AudioSource = gameObject.GetComponent(AudioSource);
    if (!audioSource) {
        DebugTool.LogErrorAndExit("This AudioSourceFactory instance is corrupt; AudioSourceFactory perfabs must have an AudioSource component, regenerate this prefab from the original.");
    } else if (!audioSource.clip) {
        DebugTool.LogErrorAndExit("This AudioSourceFactory instance does not have an audio clip. Attach it.");
    }
    
    // 用が済み次第破棄するGameObjectを用意。
    var tmpGameObject : GameObject =
    new GameObject("GeneratedAudioSource (" + audioSource.clip.name + ")");
    
    var tmpAudioSource : AudioSource = tmpGameObject.AddComponent(AudioSource);
    
    // AudioSourceの設定をコピー
    CopyProperties(audioSource, tmpAudioSource, ["name"]);
    
    // AudioSourceの位置（厳密にはAudioSourceのアタッチされたGameObjectの位置）・音量・ピッチ
    // を設定。
    tmpGameObject.transform.position = position;
    tmpAudioSource.volume = volume;
    tmpAudioSource.pitch  = tmpAudioSource.pitch + Random.Range(-pitchDeviation, pitchDeviation);
    
    // デバッグ用
#if UNITY_DEBUG
    var clipStr = tmpAudioSource.clip.ToString();
    var clipLen = tmpAudioSource.clip.length;
    var vol = tmpAudioSource.volume;
    var clipPos = tmpGameObject.transform.position;
    DebugTool.RegisterWatchVars("Audio clip",
                                function() {
                                    return clipStr + " (length: " + clipLen + ")";
                                });
    DebugTool.RegisterWatchVars("Volume of last audio source",
                                function() {
                                    return vol;
                                });
    DebugTool.RegisterWatchVars("Position of last audio source",
                                function() {
                                    return clipPos;
                                });
#endif
    
    tmpAudioSource.Play();
    // オーディオクリップの長さが経ったら（再生を終えたら）、一時GameObjectを破棄。
    Destroy(tmpGameObject, tmpAudioSource.clip.length);
}
