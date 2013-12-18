#pragma strict

import System.Reflection;

public class HyperBehaviour extends MonoBehaviour
{
    // MonoBehaviour(String, float)の様にStringを渡すのではなく、デリゲートを渡す。
    // 関数名Stringの指定し間違いはRuntimeじゃないと解らないが、関数渡しなら関数名のタイプミスはコ
    // ンパイルタイムで解る。
    public function Invoke(task : System.Delegate, time : float)
    {
        Invoke(task.Method.Name, time);
    }
}

function UnusedFunction() {
    
}

// あらゆる2つのSystem.Object（無論UnityEngine以下のクラスも含む）間で共通する書き込み可能なプロパ
// ティをコピーする。
static function CopyProperties(srcObject, dstObject, ignoreList : String[])
{
    var srcProps = srcObject.GetType().GetProperties();
    
    for (var srcProp : PropertyInfo in srcProps)
    {
        if (ignoreList && System.Array.Exists(ignoreList, function(x) x == srcProp.Name))
            continue;
        var dstProp : PropertyInfo = dstObject.GetType().GetProperty(srcProp.Name);
        // 入力元プロパティが読み取れない、入力元に対応する出力先プロパティが無い、出力先プロパティ
        // が書き込み不可、もしくはプロパティがObsoleteで使用が推奨されない場合、スキップする。
        if (!dstProp || !dstProp.CanWrite ||
            dstProp.GetCustomAttributes(typeof(System.ObsoleteAttribute), true).Length != 0)
            continue;
        var tmp = srcProp.GetValue(srcObject, null);
        dstProp.SetValue(dstObject, tmp, null);
    }
}
