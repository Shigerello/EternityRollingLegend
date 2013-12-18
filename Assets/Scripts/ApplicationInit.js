#pragma strict

public class ApplicationInit extends MonoBehaviour
{
    var isFullscreen = true;
    var randomSeed = 1234567890;
    
    function Awake() {
        // スクリーンをスリープさせない。
        Screen.sleepTimeout = SleepTimeout.NeverSleep;
        // 解像度およびフルスクリーン設定
        Screen.SetResolution(Screen.currentResolution.width,
                             Screen.currentResolution.height,
                             isFullscreen);
        // 乱数生成の種を設定；デバッグし易く。
        Random.seed = randomSeed;
        
        // デバッグ用
#if UNITY_DEBUG
        DebugTool.DisplayWatchVars();
#endif
    }
    
}
