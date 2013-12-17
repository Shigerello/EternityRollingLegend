#pragma strict

private var velMin : float = 0.01;
private var velMax : float = 30;
private var magMin : float = 0.6;
private var magMax : float = 1;
private var pitchDeviation : float = 0.2;
private var wallHitSoundFactory : AudioSourceFactory;
private var GenerateSound : Function;

function Awake() {
    // 
    wallHitSoundFactory = GameObject.Find("AudioManager").GetComponent(AudioSourceFactory);
    
    //
    if (wallHitSoundFactory) {
        GenerateSound = function(collision : Collision) {
            
            // 全衝突点の平均を計算、そこを音源にする。
            var avgPos : Vector3;
            for (var contact : ContactPoint in collision.contacts) {
                avgPos += contact.point;
            }
            avgPos /= collision.contacts.length;
            
            // 衝突速度に応じて音の大きさを設定する（そもそも鳴らさないとか）
            var mag = collision.relativeVelocity.magnitude;
//            DebugTool.LogErrorAndExit("### ("+avgPos+"), velMag: " + mag); // Debug
            if (mag > velMin) {
                var volume = mag <= velMax ?
                (magMax-magMin)*Mathf.Pow((mag-velMin)/(velMax-velMin), 2)+magMin : 1;
                wallHitSoundFactory.Create(avgPos, volume, pitchDeviation);
            }
        };
    }
    else {
        GenerateSound = function() {};
    }
}

function OnCollisionEnter(collision : Collision) {
    GenerateSound(collision);
}
