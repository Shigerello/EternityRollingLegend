#pragma strict

private var velocityCutMix : float = 2;
private var velocityCutMax : float = 30;
private var wallHitSoundFactory : AudioSourceFactory;

function Awake() {
    wallHitSoundFactory = GameObject.Find("AudioSourceFactory").GetComponent(AudioSourceFactory);
}

function OnCollisionEnter(collision : Collision) {
    // Debug-draw all contact points and normals
    var avg : Vector3;
    for (var contact : ContactPoint in collision.contacts) {
        avg += contact.point;
    }
    avg /= collision.contacts.length;
    
    // Play a sound if the coliding objects had a big impact.
    var mag = collision.relativeVelocity.magnitude;
    if (mag > velocityCutMix) {
        var normalizedMag = mag <= velocityCutMax ? mag/velocityCutMax : 1;
        var PlaySound : Function = wallHitSoundFactory.Create(avg);
        PlaySound();
    }
}
