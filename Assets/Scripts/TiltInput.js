#pragma strict

// 滑らかさ；小さな値ほど滑らかに。
var smooth = 5.0;
// 最大傾き（度）
var tiltAngleMax = 15.0;

var parent : GameObject;

private var tiltAroundX;
private var tiltAroundZ;

function Start() {
#if UNITY_DEBUG
    DebugTool.RegisterWatchVars("position & rotation",
                                function() transform.position + " " + transform.rotation
                                );
    DebugTool.RegisterWatchVars("tiltAroundX & tiltAroundZ",
                                function() tiltAroundX + " " + tiltAroundZ
                                );
    DebugTool.DisplayWatchVars();
#endif
}

function Update() {
    var dir : Vector3 = Vector3.zero;
    // we assume that device is held parallel to the ground
    // and Home button is in the right hand
    
#if UNITY_EDITOR
    tiltAroundZ = Input.GetAxis("Horizontal")*tiltAngleMax;
    tiltAroundX = -Input.GetAxis("Vertical")*tiltAngleMax;
#else
    tiltAroundZ =  Mathf.Clamp(Input.acceleration.x*90, -tiltAngleMax, tiltAngleMax);
    tiltAroundX = -Mathf.Clamp(Input.acceleration.y*90, -tiltAngleMax, tiltAngleMax);
#endif
    var targetRotation = Quaternion.Euler(tiltAroundX, 0, tiltAroundZ);
    
    // Move object
    //    transform.parent.rotation = Quaternion.Slerp(transform.rotation,
    //                                                 targetRotation,
    //                                                 Time.deltaTime * smooth);
    
    transform.rotation =
    Quaternion.Slerp(transform.rotation,
                     targetRotation,
                     Time.deltaTime * smooth);
}
