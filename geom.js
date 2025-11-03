// Basic points and matrices

function makePoint(x,y) { return { x : x, y : y }; }
function makeAffine( a, b, c, d, e, f ) { return [a,b,c,d,e,f]; };
function makeBox( x, y, w, h ) { return { x: x, y : y, w : w, h : h }; }

function makeAffine( a, b, c, d, e, f ) { return [a,b,c,d,e,f]; };
function pointAdd( p, q ) { return { x : p.x+q.x, y : p.y+q.y }; }
function pointSub( p, q ) { return { x : p.x-q.x, y : p.y-q.y }; }
function pointScale( p, a ) { return { x : p.x*a, y : p.y*a }; }
function dot( p, q ) { return p.x*q.x + p.y*q.y; }

function pointDist( p, q ) { 
	var dx = p.x - q.x;
	var dy = p.y - q.y;
	return sqrt( dx*dx + dy*dy );
}

function inv( T )
{
	const det = T[0]*T[4] - T[1]*T[3];
	return makeAffine( 
		T[4]/det, -T[1]/det, (T[1]*T[5]-T[2]*T[4])/det,
		-T[3]/det, T[0]/det, (T[2]*T[3]-T[0]*T[5])/det );
}

function mul( A, B ) 
{
	if( B.hasOwnProperty( 'x' ) ) {
		// Matrix * Point
		return { 
			x : A[0]*B.x + A[1]*B.y + A[2],
			y : A[3]*B.x + A[4]*B.y + A[5] };
	} else {
		// Matrix * Matrix
		return [A[0]*B[0] + A[1]*B[3], 
			A[0]*B[1] + A[1]*B[4],
			A[0]*B[2] + A[1]*B[5] + A[2],

			A[3]*B[0] + A[4]*B[3], 
			A[3]*B[1] + A[4]*B[4],
			A[3]*B[2] + A[4]*B[5] + A[5]];
	}
}

function matchSeg( p, q )
{
	return makeAffine(
		q.x-p.x, p.y-q.y, p.x,
		q.y-p.y, q.x-p.x, p.y );
}

function matchTwoSegs( p1, q1, p2, q2 )
{
	return mul( matchSeg( p2, q2 ), inv( matchSeg( p1, q1 ) ) );
}

// Get an affine transformation that allows box b1 to fill
// box b2, possibly with a 90 degree rotation for better fit.
function fillBox( b1, b2, rot )
{
	const sc = min( b2.w / b1.w, b2.h / b1.h );
	const rsc = min( b2.w / b1.h, b2.h / b1.w );

	if( !rot || (sc > rsc) ) {
		// Scale without rotation.
		return mul(
			makeAffine( 1, 0, b2.x+0.5*b2.w, 0, 1, b2.y+0.5*b2.h ),
			mul( 
				makeAffine( sc, 0, 0, 0, sc, 0 ),
				makeAffine( 1, 0, -(b1.x+0.5*b1.w), 0, 1, -(b1.y+0.5*b1.h) ) ) );
	} else {
		// Scale with rotation.
		return mul(
			makeAffine( 1, 0, b2.x+0.5*b2.w, 0, 1, b2.y+0.5*b2.h ),
			mul( 
				mul( 
					makeAffine( rsc, 0, 0, 0, rsc, 0 ),
					makeAffine( 0, -1, 0, 1, 0, 0 ) ),
				makeAffine( 1, 0, -(b1.x+0.5*b1.w), 0, 1, -(b1.y+0.5*b1.h) ) ) );
	}
}

function groupTiles( tiles )
{
	// Build a list of segments, eliminating matching pairs.
	var segs = [];
	for( var t of tiles ) {
		var len = t.length;
		for( var idx = 0; idx < len; ++idx ) {
			var P = t[idx];
			var Q = t[(idx+1)%len];
			var found = -1;

			// If this segment already exists in the opposite orientation, 
			// don't add it again.
			for( var sidx = 0; sidx < segs.length; ++sidx ) {
				var s = segs[sidx];

				if( (pointDist(s[0],Q) < 0.0001) && (pointDist(s[1],P)<0.0001) ) {
					found = sidx;
					break;
				}
			}

			if( found >= 0 ) {
				// Eliminate the match too.
				segs.splice( found, 1 );
			} else {
				segs.push( [P,Q] );
			}
		}
	}

	// Now reconstruct the boundary from the remaining segments.
	var ret = [segs[0][0]];
	var last = segs[0][1];
	segs = segs.splice(1);

	while( segs.length > 0 ) {
		for( var idx = 0; idx < segs.length; ++idx ) {
			if( pointDist( segs[idx][0], last ) < 0.0001 ) {
				ret.push( segs[idx][0] );
				last = segs[idx][1];
				segs.splice( idx, 1 );
				break;
			}
		}
	}

	return ret;
}
