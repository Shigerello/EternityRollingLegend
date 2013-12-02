
// フォロワーのTransform（このスクリプトがアタッチされたオブジェクトのTransform）
//var transform : Transform;
// フォロワーのRigidbody（このスクリプトがアタッチされたオブジェクトのRigidbody）
//var rigidbody : Rigidbody;

// ターゲットのGameObject
var _TargetGameObject : GameObject;

// ターゲットのローカル座標（ワールド座標ではない）におけるターゲットからフォロワーへの距離の目標値
var _Displace : Vector3 = Vector3(0,6*0.9,-18*0.9);

var _AngularSmoothLag = 0.3;
var _AngularMaxSpeed = 15.0;
var _DisplaceSmoothLag = 0.3;

var _SnapAngularSmoothLag = 0.001;
var _SnapAngularMaxSpeed = 10000;
var _SnapDisplaceSmoothLag = 0.001;

private var targetCollider : Collider; // 参照渡し
private var angleVelocity = 0.0;
private var xVelocity = 0.0;
private var yVelocity = 0.0;
private var zVelocity = 0.0;

// 向きや位置を目標値に漸近的に変更する関数。
private var SmoothDampAngle : Function;
private var SmoothDamp : Function;

#if UNITY_DEBUG // デバッグ用
private var watchVars : UnityDictionary;
private var lineMarble : LineRenderer;
private var lineFollower : LineRenderer;
function DebugDirection(targetAngle : float, targetQuanternion : Quaternion) {
    lineMarble.SetPosition(0, _TargetGameObject.transform.position);
    lineMarble.SetPosition(1, _TargetGameObject.transform.position + _TargetGameObject.rigidbody.velocity.normalized*10);
    
    lineFollower.SetPosition(0, _TargetGameObject.transform.position);
    lineFollower.SetPosition(1, _TargetGameObject.transform.position + (targetQuanternion*_Displace));
}
#endif

function Awake ()
{
#if UNITY_DEBUG // デバッグ用
    watchVars = GameObject.Find("DebugTool").GetComponent(DebugTool).watchVars;
    
    var mat = new Material(Shader.Find("Particles/Additive"));
    
    var lineMarbleGameObject : GameObject = GameObject();
    lineMarble = lineMarbleGameObject.AddComponent(LineRenderer);
    lineMarble.material = mat;
    lineMarble.SetColors(Color.red, Color.yellow);
    lineMarble.SetWidth(0.2, 0.2);
    lineMarble.SetVertexCount(2);
    
    var lineFollowerGameObject : GameObject = GameObject();
    lineFollower = lineFollowerGameObject.AddComponent(LineRenderer);
    lineFollower.material = mat;
    lineFollower.SetColors(Color.blue, Color.cyan);
    lineFollower.SetWidth(0.2, 0.2);
    lineFollower.SetVertexCount(2);
#endif
    
	if (!transform) {
		Debug.Log("Please attach the FollowingCamera script to a follower object.");
		enabled = false;
	}
	
	if (_TargetGameObject && _TargetGameObject.collider && _TargetGameObject.collider)
	{
		targetCollider = _TargetGameObject.collider;
	}
	else
    Debug.Log("Please assign a target GameObject with a collider and rigidbody to the FollowingCamera script.");
    
    // スナッピング：即座にフォロワーの向きや位置を目標値に合わせる。
    SmoothDampAngle = SmoothDampAngleSnapping;
    SmoothDamp = SmoothDampSnapping;
	Follow();
}

function FixedUpdate() {
	Follow();
}

function Follow()
{
	// ターゲットが存在しなければ処理を切り上げる。
	if (!_TargetGameObject)
    return;
    
    //	// Fire2 (alt) キーが押されていたら、フォロワーをスナッピングする。
    //	if (Input.GetButton("Fire2"))
    //    {
    //        SmoothDampAngle = SmoothDampAngleSnapping;
    //        SmoothDamp = SmoothDampSnapping;
    //    }
    
    // ターゲットとフォロワーの縦軸（y軸）周りの回転（進行方向）を取得。
    var targetQuanternion : Quaternion = Quaternion.FromToRotation(Vector3.forward, _TargetGameObject.rigidbody.velocity);
    var targetAngle = targetQuanternion.y;
	var currentAngle = transform.eulerAngles.y;
    
#if UNITY_DEBUG // デバッグ用
    DebugDirection(targetAngle, targetQuanternion);
#endif
    
    // フォロワーの前進方向をターゲットの前進方向に漸近させる。
    currentAngle = SmoothDampAngle(currentAngle, targetAngle);
    
#if UNITY_DEBUG // デバッグ用
    watchVars.dictionary["currentAngle"] = function() {return currentAngle;};
#endif
    
    // ターゲットの現在位置を取得。
    var targetPosition : Vector3 = targetCollider.bounds.center;
    // フォロワーの位置を取得。
	var currentPosition = transform.position;
    var nextPosition : Vector3;
    
    // ターゲットの向いている方向（currentAngleの向き）を前方にみたてたローカル座標において、
    // ターゲットの現在位置から_Displaceだけずれた位置をフォロワーの目標位置とする。
    nextPosition = targetPosition + targetQuanternion * _Displace;
    
    // 壁への衝突（フォロワーとターゲットの直線上間に障害物）があれば、その衝突した部分にフォロワー
    // を置く。
    var wallHit : RaycastHit;
    if (Physics.Linecast(targetPosition, nextPosition, wallHit))
    {
        Debug.DrawRay(wallHit.point, wallHit.normal, Color.red);
        nextPosition = Vector3(wallHit.point.x, nextPosition.y, wallHit.point.z);
    }
    
    // フォロワーの位置をフォロワーの目標位置に漸近させる。
    currentPosition = SmoothDamp(currentPosition, nextPosition);
#if UNITY_DEBUG // デバッグ用
    watchVars.dictionary["currentPosition"] = function() {return currentPosition;};
#endif
    
    // Transformをフォロワーに適用。
	transform.position = currentPosition;
	
	// フォロワーをターゲットの中心に向ける
	transform.LookAt(targetCollider.bounds.center);
}

function SmoothDampAngleSnapping(currentAngle, targetAngle)
{
    currentAngle = Mathf.SmoothDampAngle(currentAngle, targetAngle, angleVelocity, _SnapAngularSmoothLag, _SnapAngularMaxSpeed);
    
    // ターゲットとフォロワーの向きがほぼ同じになったので、スナッピングを停止。
    if (AngleDistance(currentAngle, targetAngle) < 3.0)
    {
        SmoothDampAngle = SmoothDampAngleNormal;
        SmoothDamp = SmoothDampNormal;
    }
    
    return currentAngle;
}

function SmoothDampAngleNormal(currentAngle, targetAngle)
{
    return Mathf.SmoothDampAngle(currentAngle, targetAngle, angleVelocity, _AngularSmoothLag, _AngularMaxSpeed);
}

function SmoothDampSnapping(currentPosition : Vector3, targetPosition : Vector3)
{
    currentPosition.x = Mathf.SmoothDamp(currentPosition.x, targetPosition.x, xVelocity, _SnapDisplaceSmoothLag);
    currentPosition.y = Mathf.SmoothDamp(currentPosition.y, targetPosition.y, yVelocity, _SnapDisplaceSmoothLag);
    currentPosition.z = Mathf.SmoothDamp(currentPosition.z, targetPosition.z, zVelocity, _SnapDisplaceSmoothLag);
    
    return currentPosition;
}

function SmoothDampNormal(currentPosition : Vector3, targetPosition : Vector3)
{
    currentPosition.x = Mathf.SmoothDamp(currentPosition.x, targetPosition.x, xVelocity, _DisplaceSmoothLag);
    currentPosition.y = Mathf.SmoothDamp(currentPosition.y, targetPosition.y, yVelocity, _DisplaceSmoothLag);
    currentPosition.z = Mathf.SmoothDamp(currentPosition.z, targetPosition.z, zVelocity, _DisplaceSmoothLag);
    
    return currentPosition;
}

function AngleDistance (a : float, b : float)
{
	a = Mathf.Repeat(a, 360);
	b = Mathf.Repeat(b, 360);
	
	return Mathf.Abs(b - a);
}
