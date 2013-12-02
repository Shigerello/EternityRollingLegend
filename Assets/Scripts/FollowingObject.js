
// フォロワーのTransform（このスクリプトがアタッチされたオブジェクトのTransform）
//var transform : Transform;
// フォロワーのRigidbody（このスクリプトがアタッチされたオブジェクトのRigidbody）
//var rigidbody : Rigidbody;

// ターゲットのTransform
var _TargetTransform : Transform;

// ターゲットのローカル座標（ワールド座標ではない）におけるターゲットからフォロワーへの距離の目標値
var _Displace : Vector3 = Vector3(0,4,-7.0);

var _AngularSmoothLag = 0.3;
var _AngularMaxSpeed = 15.0;
var _DisplaceSmoothLag = 0.3;

var _SnapAngularSmoothLag = 0.001;
var _SnapAngularMaxSpeed = 10000;
var _SnapDisplaceSmoothLag = 0.001;

var _ClampHeadPositionScreenSpace = 0.75;

var _LockCameraTimeout = 0.2;

private var targetCollider : Collider;

private var angleVelocity = 0.0;
private var xVelocity = 0.0;
private var yVelocity = 0.0;
private var zVelocity = 0.0;
private var snap = false;

// 追跡を行う関数。値として関数Follow_Snap（目的位置に即座に行く）かFollow_Normal（目的位置にスムー
// スに行く）をとる。
private var Follow : Function;

// デバッグ用
var lineRenderer : LineRenderer;

function Awake ()
{
    lineRenderer = gameObject.AddComponent(LineRenderer);
    lineRenderer.material = new Material (Shader.Find("Particles/Additive"));
    lineRenderer.SetColors(Color.red, Color.yellow);
    lineRenderer.SetWidth(0.2, 0.2);
    lineRenderer.SetVertexCount(2);
    
	if (!transform) {
		Debug.Log("Please attach the FollowingCamera script to a follower object.");
		enabled = false;
	}
	
	if (_TargetTransform)
	{
		targetCollider = _TargetTransform.collider;
	}
	else
		Debug.Log("Please assign a target object to the FollowingCamera script.");
    
    // スナッピング：即座にフォロワーの向きをターゲットの向きに合わせる。
    Follow = Follow_Snap;
	Follow();
}

function FixedUpdate() {
	Follow();
}

function Follow_Snap()
{
	// ターゲットが存在しなければ処理を切り上げる。
	if (!_TargetTransform)
		return;
    
    //	// Fire2 (alt) キーが押されていたら、フォロワーをスナッピングする。
    //	if (Input.GetButton("Fire2"))
    //		Follow = Follow_Snap;
    
    // ターゲットとフォロワーの縦軸（y軸）周りの回転（進行方向）を取得。
	var targetAngle = _TargetTransform.eulerAngles.y;
	var currentAngle = transform.eulerAngles.y;
    
//    var test : Quaternion = Quaternion.Euler (0, currentAngle, 0);
//    Gizmos.DrawLine(_TargetTransform.position, _TargetTransform.position + test*Vector3.forward*10);
    lineRenderer.SetPosition(0, _TargetTransform.position);
    lineRenderer.SetPosition(1, _TargetTransform.position + Quaternion.Euler (0, currentAngle, 0)*Vector3.forward*10);
    
    // フォロワーの前進方向をターゲットの前進方向に漸近させる。
    currentAngle = Mathf.SmoothDampAngle(currentAngle, targetAngle, angleVelocity, _SnapAngularSmoothLag, _SnapAngularMaxSpeed);
    
    // ターゲットとフォロワーの向きがほぼ同じになったので、スナッピングを停止。
    if (AngleDistance (currentAngle, targetAngle) < 3.0)
        Follow = Follow_Normal;
    
    // ターゲットの現在位置を取得。
    var targetPosition : Vector3 = targetCollider.bounds.center;
    // フォロワーの位置を取得。
	var currentPosition = transform.position;
    
    // ターゲットの向いている方向（currentAngleの向き）を前方にみたてたローカル座標において、
    // ターゲットの現在位置から_Displaceだけずれた位置をフォロワーの目標位置とする。
    targetPosition += Quaternion.Euler (0, currentAngle, 0) * _Displace;
    
    // フォロワーの位置をフォロワーの目標位置に漸近させる。
    currentPosition.x = Mathf.SmoothDamp (currentPosition.x, targetPosition.x, xVelocity, _SnapDisplaceSmoothLag);
    currentPosition.y = Mathf.SmoothDamp (currentPosition.y, targetPosition.y, yVelocity, _SnapDisplaceSmoothLag);
    currentPosition.z = Mathf.SmoothDamp (currentPosition.z, targetPosition.z, zVelocity, _SnapDisplaceSmoothLag);
    
    // Transformをフォロワーに適用。
	transform.position = currentPosition;
	
	// フォロワーをターゲットの中心に向ける
	transform.LookAt(targetCollider.bounds.center);
}

function Follow_Normal()
{
	// ターゲットが存在しなければ処理を切り上げる。
	if (!_TargetTransform)
		return;
    
    //	// Fire2 (alt) キーが押されていたら、フォロワーをスナッピングする。
    //	if (Input.GetButton("Fire2"))
    //		Follow = Follow_Snap;
    
    // ターゲットとフォロワーの縦軸（y軸）周りの回転（進行方向）を取得。
	var targetAngle = _TargetTransform.eulerAngles.y;
	var currentAngle = transform.eulerAngles.y;
	
//    var test : Quaternion = Quaternion.Euler (0, currentAngle, 0);
//    Gizmos.DrawLine(_TargetTransform.position, _TargetTransform.position + test*Vector3.forward*10);
    lineRenderer.SetPosition(0, _TargetTransform.position);
    lineRenderer.SetPosition(1, _TargetTransform.position + Quaternion.Euler (0, currentAngle, 0)*Vector3.forward*10);
    
    // フォロワーの前進方向をターゲットの前進方向に漸近させる。
    currentAngle = Mathf.SmoothDampAngle(currentAngle, targetAngle, angleVelocity, _AngularSmoothLag, _AngularMaxSpeed);
    
    // ターゲットの現在位置を取得。
    var targetPosition : Vector3 = targetCollider.bounds.center;
    // フォロワーの位置を取得。
	var currentPosition = transform.position;
    
    // ターゲットの向いている方向（currentAngleの向き）を前方にみたてたローカル座標において、
    // ターゲットの現在位置から_Displaceだけずれた位置をフォロワーの目標位置とする。
    targetPosition += Quaternion.Euler (0, currentAngle, 0) * _Displace;
    
    // フォロワーの位置をフォロワーの目標位置に漸近させる。
    currentPosition.x = Mathf.SmoothDamp (currentPosition.x, targetPosition.x, xVelocity, _DisplaceSmoothLag);
    currentPosition.y = Mathf.SmoothDamp (currentPosition.y, targetPosition.y, yVelocity, _DisplaceSmoothLag);
    currentPosition.z = Mathf.SmoothDamp (currentPosition.z, targetPosition.z, zVelocity, _DisplaceSmoothLag);
    
    // Transformをフォロワーに適用。
	transform.position = currentPosition;
	
	// フォロワーをターゲットの中心に向ける
	transform.LookAt(targetCollider.bounds.center);
}

function AngleDistance (a : float, b : float)
{
	a = Mathf.Repeat(a, 360);
	b = Mathf.Repeat(b, 360);
	
	return Mathf.Abs(b - a);
}
