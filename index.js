var theCanvas;

const DEBUG = true;
var MODE = 0;

var LINE_DENSITY;
var NUM_LINES;
var GRID_SIDE;
var FOCUS;
var SHIMMER;

function myrand() 
{
	return random(1);
}

function initFeatures()
{
	let v = myrand();
	if( v < 0.7 ) {
		LINE_DENSITY = 10;
		NUM_LINES = 25;
	} else if( v < 0.9 ) {
		LINE_DENSITY = 6;
		NUM_LINES = 9;
	} else {
		LINE_DENSITY = 20;
		NUM_LINES = 40;
	}

	v = myrand();
	if( v < 0.75 ) {
		FOCUS = 'None';
	} else if( v < 0.95 ) {
		FOCUS = 'Eight';
	} else {
		FOCUS = 'Sixteen';
	}

	v = myrand();
	if( v < 0.75 ) {
		SHIMMER = -1;
	} else {
		SHIMMER = int(3*myrand())+2;
	}

	GRID_SIDE = (2*LINE_DENSITY)+1;
}

function initColours()
{
	colorMode( HSB, 100 );
	COLS = [
		color( myrand() * 100, myrand() * 100, myrand() * 30 ),
		color( myrand() * 100, myrand() * 10, 100 - myrand() * 5 ),
		color( myrand() * 100, myrand() * 50 + 25, myrand() * 50 + 25 ),
		color( myrand() * 100, myrand() * 50 + 25, myrand() * 50 + 25 ),
		color( myrand() * 100, myrand() * 50 + 25, myrand() * 50 + 25 ) ];
	colorMode( RGB, 255 );
}

const ordered_dirs = [5,2,1,0,3,6,7,8];
const r22 = Math.sqrt(2.0) * 0.5;
const int_dir_vecs = [
	makePoint(-1,-1), makePoint(0,-1), makePoint(1,-1),
	makePoint(-1,0), makePoint(0,0), makePoint(1,0),
	makePoint(-1,1), makePoint(0,1), makePoint(1,1) ];
const dir_vecs = [
	makePoint(-r22,-r22), makePoint(0,-1), makePoint(r22,-r22),
	makePoint(-1,0), makePoint(0,0), makePoint(1,0),
	makePoint(-r22,r22), makePoint(0,1), makePoint(r22,r22) ];

var lines;
var grid;
var groups;
var tiles;
var boundary;

function createLines( num )
{
	all_lines = [];
	keep_lines = [];
	groups = [];

	function makeLine( pos, dir )
	{
		return { pos : pos, dir : dir };
	}

	function makeAllLines( n )
	{
		// Horizontal lines, emanating from left edge
		for( let i = 0; i < n+1; ++i ) {
			all_lines.push( makeLine( makePoint(0,2*i), makePoint(1,0) ) );
		}

		// Vertical lines, emanating from top edge
		for( let i = 0; i < n+1; ++i ) {
			all_lines.push( makeLine( makePoint(2*i,0), makePoint(0,1) ) );
		}

		// Slope -1 lines.  n pointing NW, n+1 pointing SE
		for( let i = 0; i < n+1; ++i ) {
			all_lines.push( makeLine( makePoint(2*n,2*i), makePoint(-1,-1) ) );
		}
		for( let i = 0; i < n; ++i ) {
			all_lines.push( makeLine( makePoint(0,2*i+2), makePoint(1,1) ) );
		}

		// Slope 1 lines.  n+1 pointing NE, n pointing SW
		for( let i = 0; i < n+1; ++i ) {
			all_lines.push( makeLine( makePoint(0,2*i), makePoint(1,-1) ) );
		}
		for( let i = 0; i < n; ++i ) {
			all_lines.push( makeLine( makePoint(2*i+2,2*n), makePoint(1,-1) ) );
		}
	}

	function makeRandomStar( n )
	{
		const ax = int(myrand()*(n-4))+2;
		const ay = int(myrand()*(n-4))+2;
		// console.log( ax, ay );

		var plan = [
			{ idx : 4*n+7+ax+ay, keep : false },
			{ idx : 4*n+6+ax+ay, keep : true },
			{ idx : 4*n+5+ax+ay, keep : false },
			{ idx : 4*n+4+ax+ay, keep : false },
			{ idx : 4*n+3+ax+ay, keep : false },
			{ idx : 4*n+2+ax+ay, keep : true },
			{ idx : 4*n+1+ax+ay, keep : false },

			{ idx : 3*n+5+ax-ay, keep : false },
			{ idx : 3*n+4+ax-ay, keep : true },
			{ idx : 3*n+3+ax-ay, keep : false },
			{ idx : 3*n+2+ax-ay, keep : false },
			{ idx : 3*n+1+ax-ay, keep : false },
			{ idx : 3*n+0+ax-ay, keep : true },
			{ idx : 3*n-1+ax-ay, keep : false },

			{ idx : n+1+ay+2, keep : true },
			{ idx : n+1+ay+1, keep : false },
			{ idx : n+1+ay, keep : false },
			{ idx : n+1+ay-1, keep : true },

			{ idx : ax+2, keep : true },
			{ idx : ax+1, keep : false },
			{ idx : ax, keep : false },
			{ idx : ax-1, keep : true } ];
	
		for( var step of plan ) {
			if( step.keep ) {
				keep_lines.push( all_lines[step.idx] );
			}
			all_lines.splice( step.idx, 1 );
		}

		groups.push( [
			makePoint( 2*ay+1, 2*ax-3 ),

			makePoint( 2*ay-2, 2*ax-2 ),
			makePoint( 2*ay, 2*ax-2 ),
			makePoint( 2*ay+2, 2*ax-2 ),
			makePoint( 2*ay+4, 2*ax-2 ),

			makePoint( 2*ay-2, 2*ax ),
			makePoint( 2*ay+4, 2*ax ),

			makePoint( 2*ay-3, 2*ax+1 ),
			makePoint( 2*ay+5, 2*ax+1 ),

			makePoint( 2*ay-2, 2*ax+2 ),
			makePoint( 2*ay+4, 2*ax+2 ),

			makePoint( 2*ay-2, 2*ax+4 ),
			makePoint( 2*ay, 2*ax+4 ),
			makePoint( 2*ay+2, 2*ax+4 ),
			makePoint( 2*ay+4, 2*ax+4 ),

			makePoint( 2*ay+1, 2*ax+5 ) ] );
	}

	function makeRandom2x2( n )
	{
		// Remove some lines from the array so that a random 2x2 block is 
		// forced to be part of the result.  Return the vertices associated
		// with that block.
		if( myrand() < 0.5 ) {
			const ax = int(myrand()*n);
			const ay = int(myrand()*n);

			// remove diagonals around 2x2 vertices at (ax,ay)
			var rem = [];

			for( var i = 0; i < 3; ++i ) {
				var k = (2*n+2) + (n-1) + ax - ay;
				if( (k >= 2*n+2) && (k < 4*n+3) ) {
					rem.push( k );
				}
			}

			for( var i = 0; i < 3; ++i ) {
				var k = 4*n + 3 + i + ax + ay;
				rem.push( k );
			}

			rem.reverse();
			for( let i of rem ) {
				all_lines.splice( i, 1 );
			}

			// Mark these vertices for later
			groups.push( [makePoint(2*ay,2*ax), makePoint(2*ay+2,2*ax),
				makePoint(2*ay,2*ax+2), makePoint(2*ay+2,2*ax+2)] );

			// Keep the necessary H and V lines
			for( let i of [n+1+ay+1,n+1+ay,ax+1,ax] ) {
				keep_lines.push( all_lines[i] );
				all_lines.splice( i, 1 );
			}
		} else {
			// on the bias.  Remove 2h,1v or 1h,2v
			const a = int(myrand()*n);
			const b = int(myrand()*(n-1))+1;
			// console.log( a, b );

			if( myrand() < 0.5 ) {
				all_lines.splice( n+1+a+1, 1 );
				all_lines.splice( n+1+a, 1 );
				all_lines.splice( b, 1 );
				groups.push( [makePoint(2*a+1,2*b-1),makePoint(2*a+1,2*b+1),
					makePoint(2*a,2*b), makePoint(2*a+2,2*b)] );

				for( var i of [4*n+a+b+1,4*n+a+b,3*n-1+b-a,3*n-2+b-a] ) {
					keep_lines.push( all_lines[i] );
					all_lines.splice( i, 1 );
				}
			} else {
				all_lines.splice( n+1+b, 1 );
				all_lines.splice( a+1, 1 );
				all_lines.splice( a, 1 );
				groups.push( [makePoint(2*b,2*a),makePoint(2*b,2*a+2),
					makePoint(2*b-1,2*a+1), makePoint(2*b+1,2*a+1)] );

				for( var i of [4*n+a+b+1,4*n+a+b,3*n+a-b,3*n-1+a-b] ) {
					keep_lines.push( all_lines[i] );
					all_lines.splice( i, 1 );
				}
			}
		}
	}

	makeAllLines( LINE_DENSITY );
	if( FOCUS == 'Eight' ) {
		makeRandom2x2( LINE_DENSITY );
	} else if( FOCUS == 'Sixteen' ) {
		makeRandomStar( LINE_DENSITY );
	}

	// Discount the lines you've already used.
	num -= keep_lines.length;

	while( (all_lines.length > 0) && (num > 0) ) {
		let ri = int(myrand()*all_lines.length);
		keep_lines.push( all_lines[ri] );
		all_lines.splice( ri, 1 );
		--num;
	}

	return { lines : keep_lines, groups : groups };
}

class Grid
{
	constructor()
	{
		this.data = [];
		for( var idx = 0; idx < GRID_SIDE*GRID_SIDE; ++idx ) {
			this.data.push( { users : [], drawn : false, group : -1 } );
		}
	}

	getCell( pt )
	{
		return this.data[pt.y * GRID_SIDE + pt.x];
	}

	getUsers( pt )
	{
		return this.getCell( pt ).users;
	}

	numUsers( pt )
	{
		return this.getUsers( pt ).length;
	}

	addUser( pt, line )
	{
		this.getCell( pt ).users.push( line );
	}

	clearDrawn()
	{
		for( let c of this.data ) {
			c.drawn = false;
		}
	}

	isDrawn( pt )
	{
		return this.getCell( pt ).drawn;
	}

	setDrawn( pt )
	{
		this.getCell( pt ).drawn = true;
	}

	getGroup( pt ) 
	{
		return this.getCell( pt ).group;
	}

	setGroup( pt, g ) 
	{
		this.getCell( pt ).group = g;
	}

	markRay( line, pos, dir )
	{
		while( (pos.x>=0) && (pos.x<GRID_SIDE) && (pos.y>=0) && (pos.y<GRID_SIDE) ) {
			this.addUser( pos, line );
			pos = pointAdd( pos, dir );
		}
	}

	markLine( line )
	{
		var p = line.pos;
		var d = line.dir;

		this.markRay( line, p, d );
		this.markRay( line, pointSub( p, d ), pointScale( d, -1 ) );
	}

	markLines( lines ) 
	{
		for( var l of lines ) {
			this.markLine( l );
		}
	}

	// find next intersection in this direction.
	findNeighbour( pt, dir )
	{
		pt = pointAdd( pt, dir );
		while( (pt.x>=0) && (pt.x<GRID_SIDE) && (pt.y>=0) && (pt.y<GRID_SIDE) ) {
			if( this.numUsers( pt ) > 1 ) {
				return pt;
			}
			pt = pointAdd( pt, dir );
		}
		return null;
	}

	// Get graph-theoretic neighbours of this x,y position in the
	// intersection grid.
	getNeighbours( pos )
	{
		var ret = [];
		var us = grid[pos[1]*GRID_SIDE+pos[0]].users;

		for( var d of ordered_dirs ) {
			var dir = int_dir_vecs[d];
			let n = this.findNeighbour( pos, int_dir_vecs[d] );
			if( n != null ) {
				ret.push( n );
			}
		}
		return ret;
	}
}

function getAllTiles( grid )
{
	L = []
	B = []

	var spt = null;

	for( let y = 0; y < GRID_SIDE; ++y ) {
		for( let x = 0; x < GRID_SIDE; ++x ) {
			var pt = makePoint( x, y );
			var l = grid.numUsers( pt );
			if( l >= 2 ) {
				// getTilesFrom( grid, pt, null, null, L, B );
				// return { tiles : L, boundary : B };
				spt = pt;
				break;
			}
		}
		if( spt != null ) {
			break;
		}
	}

	var stack = [{ pos: spt, ap: null, aq: null}];

	while( stack.length > 0 ) {
		var a = stack.pop();
		var pt = a.pos;

		if( grid.isDrawn( pt ) ) {
			continue;
		}

		var align_p = a.ap;
		var align_q = a.aq;
		
		var us = grid.getUsers( pt );
		var pts = [];

		grid.setDrawn( pt );

		var used_dirs = new Set();

		for( var l of us ) {
			d = l.dir;
			used_dirs.add( (d.y+1)*3 + (d.x+1) );
			used_dirs.add( (-d.y+1)*3 + (-d.x+1) );
		}

		// First, compute the polygon we want to draw.
		var last = makePoint( 0, 0 );
		for( var d of ordered_dirs ) {
			if( used_dirs.has( d ) ) {
				var ddir = dir_vecs[d];
				var ppdir = makePoint(-ddir.y, ddir.x);
				var npt = pointAdd( last, ppdir );
				pts.push( last );
				last = npt;
			}
		}

		// Now, figure out the translation vector we're going to use
		// for this polygon.  Find the edge whose vector matches
		// delt.
		var translation = makePoint( 0, 0 );
		if( align_p != null ) {
			var delt = pointSub( align_p, align_q );
			for( var idx = 0; idx < pts.length; ++idx ) {
				var v = pointSub( pts[(idx+1)%pts.length], pts[idx] ); 
				if( pointDist( v, delt ) < 1e-5 ) {
					translation = pointSub( align_q, pts[idx] );
					break;
				}
			}
		}

		// Rewrite the points according to the translation.
		for( var idx = 0; idx < pts.length; ++idx ) {
			pts[idx] = pointAdd( pts[idx], translation );
		}

		L.push( { vertex : pt, path : pts } );

		// Finally, recursively walk to your neighbours and tell them to
		// draw as well.
		var vidx = 0;
		for( var d of ordered_dirs ) {
			if( used_dirs.has( d ) ) {
				var neigh = grid.findNeighbour( pt, int_dir_vecs[d] );
				if( neigh != null ) {
					if( !grid.isDrawn( neigh ) ) {
						// getTilesFrom( grid, neigh, pts[vidx], pts[(vidx+1)%pts.length], L, B );
						stack.push( { pos: neigh, ap: pts[vidx], aq: pts[(vidx+1)%pts.length] } );
					}
				} else {
					// No neighbour, so these points are part of the boundary.
					B.push( pts[vidx] );
					B.push( pts[(vidx+1)%pts.length] );
				}
				vidx = vidx + 1;
			}
		}

	}

	return { tiles : L, boundary : B };
}

function buildDesign()
{
	lineinfo = createLines( NUM_LINES );
	lines = lineinfo.lines;
	groups = lineinfo.groups;
	grid = new Grid();
	grid.markLines( lines );

	var all = getAllTiles( grid );
	tiles = all.tiles;
	boundary = all.boundary;

	for( var idx = 0; idx < groups.length; ++idx ) {
		for( var pt of groups[idx] ) {
			grid.setGroup( pt, idx );
		}
		var grouptiles = [];
		for( var tidx = tiles.length-1; tidx >= 0; --tidx ) {
			var t = tiles[tidx];
			if( grid.getGroup( t.vertex ) == idx ) {
				grouptiles.push( t.path );
				tiles.splice( tidx, 1 );
			}
		}
		var newtile = groupTiles( grouptiles );
		tiles.push( { vertex : makePoint(0,0), path : newtile } );
	}
}

function newDesign()
{
	initFeatures();
	initColours();
	buildDesign();
}

function setup()
{
	theCanvas = createCanvas( windowWidth, windowHeight );
	newDesign();
}

function drawPoly( poly )
{
	beginShape();
	for( var p of poly ) {
		vertex( p.x, p.y );
	}
	endShape( CLOSE );
}

// We know the tiles we're working with here have unit-length
// edges, no need to normalize dot products.
function getSignature( t )
{
	const l = t.length;
	var ret = '';

	for( var i = 0; i < l; ++i ) {
		const a = t[(i+l-1)%l];
		const b = t[i];
		const c = t[(i+1)%l]
		const s = dot( pointSub(a,b), pointSub(c,b) )
		if( abs( s ) < 0.0001 ) {
			ret = ret + 'L';
		} else if( abs( 1 + s ) < 0.0001 ) {
			ret = ret + 'I';
		} else if( s > 0 ) {
			ret = ret + 'V';
		} else {
			ret = ret + 'C';
		}
	}

	return ret;
}

var COLS = [];

function randFill( cidx )
{
	var col = COLS[cidx];

	if( (SHIMMER>=0) && (cidx>=2) ) {
		colorMode( HSB, 255 );
		var h = hue( col );
		var s = saturation( col );
		var b = brightness( col );
		// console.log( h, s, b );
		// fill( h, s, constrain( b + (myrand()-0.5)*50, 0, 255 )  );
		col = color( h, s, constrain( b + (myrand()-0.5)*50, 0, 255 ) );
		colorMode( RGB, 255 );
	}
	fill( col );

	return col;
}

var drawn_tiles = [];

function drawTile( M, t )
{
	var lt = [...t]
	// rotate lt by a random amount
	var rl = int(myrand()*lt.length)
	lt = lt.slice(rl).concat(lt.slice(0,rl))
	var sig = getSignature( lt );
	var found = false;

	// Now rotate one step at a time until the signature is found.
	for( var idx = 0; idx < sig.length; ++idx ) {
		if( fillers.hasOwnProperty( sig ) ) {
			found = true;
			break;
		}
		lt = lt.slice(1).concat(lt.slice(0,1));
		sig = sig.slice(1).concat(sig.slice(0,1));
	}

	if( !found ) {
		console.log( "Not found: " + sig );
		return;
	}

	const clusters = fillers[sig];
	const cl = clusters[int(myrand()*clusters.length)];
	const bds = cl['bounds'];
	const fv = makePoint( bds[0], bds[1] );
	const fw = makePoint( bds[2], bds[3] );

	noStroke();

	var T = mul( M, matchTwoSegs( fv, fw, lt[0], lt[1] ) );
	for( var sh of cl['shapes'] ) {
		const pth = sh['path']
		const col = sh['colour'];

		const fcol = randFill( col );
		var dshp = [];

		beginShape();
		for( var idx = 0; idx < pth.length; idx += 2 ) {
			const spt = mul( T, makePoint(pth[idx],pth[idx+1]) );
			dshp.push( spt );
			vertex( spt.x, spt.y );
		}
		endShape( CLOSE );

		drawn_tiles.push( { path : dshp, colour : fcol } );
	}

	colorMode( RGB, 255 );
}

function drawLines( shapes ) 
{
	const cbox = makeBox( 0, 0, GRID_SIDE, GRID_SIDE );
	const sbox = makeBox( 60, 60, width-120, height-120 );
	const M = fillBox( cbox, sbox, !DEBUG );
	// console.log( M );

	fill( 200 );
	noStroke();
	const tl = mul( M, makePoint( 0, 0 ) );
	const br = mul( M, makePoint( GRID_SIDE, GRID_SIDE ) );

	rect( tl.x, tl.y, (br.x-tl.x), (br.y-tl.y) );

	noFill();
	stroke( 0 );
	strokeWeight( 1.0 );

	for( var l of lines ) {
		// console.log( l.pos, l.dir );
		const spt = mul( M, l.pos );
		// console.log( spt );
		const sdir = pointScale( l.dir, min( width, height ) );

		var a = pointAdd( spt, sdir );
		var b = pointSub( spt, sdir );
		// console.log( a, b );

		// Add a bit of randomness so that duplicates will be visible.
		// const c = makePoint( (myrand()-0.5)*5, (myrand()-0.5)*5 );
		const c = makePoint( 0, 0 );
		line( a.x+c.x, a.y+c.y, b.x+c.x, b.y+c.y );
	}

	if( shapes ) {
		fill( 255 );
		stroke( 0 );
		strokeWeight( 1.0 );
		strokeJoin( ROUND );

		for( let t of tiles ) {
			var centroid = makePoint( 0, 0 );
			for( let pt of t.path ) {
				centroid = pointAdd( centroid, pt );
			}
			centroid = pointScale( centroid, 1.0 / t.path.length );
			const sc = 0.5;

			var M2 = mul( M, 
				mul( makeAffine( 1, 0, t.vertex.x, 0, 1, t.vertex.y ),
					mul( makeAffine( sc, 0, 0, 0, sc, 0 ),
						makeAffine( 1, 0, -centroid.x, 0, 1, -centroid.y ) ) ) );

			beginShape();
			for( let pt of t.path ) {
				var wpt = mul( M2, pt );
				vertex( wpt.x, wpt.y );
			}
			endShape( CLOSE );
		}
	}

/*
	for( var g of groups ) {
		fill( myrand()*255, myrand()*255, myrand()*255 );
		for( var p of g ) {
			ellipse( p.x, p.y, 0.55, 0.55 );
		}
	}
*/
}

function exportSVG()
{
	var wr = createWriter( 'zellij', 'svg' );
	wr.print( '<svg version="1.1"' );
	wr.print( '  width="' + int(width) + '" height="' + int(height) + '"' );
	wr.print( '  baseProfile="full"' );
	wr.print( '  xmlns="http://www.w3.org/2000/svg"' );
	wr.print( '  xmlns:xlink="http://www.w3.org/1999/xlink"' );
	wr.print( '  xmlns:ev="http://www.w3.org/2001/xml-events">' );

	for( var s of drawn_tiles ) {
		var col = s.colour;
		var path = s.path;

		wr.write( '  <polygon points="' );
		for( var idx = 0; idx < path.length; ++idx ) {
			if( idx > 0 ) {
				wr.write( ' ' );
			}
			wr.write( '' + path[idx].x + ',' + path[idx].y );
		}
		wr.print( '" style="fill:rgb(' + 
			int(red(col)) + ',' + int(green(col)) + ',' + int(blue(col)) + ')"/>' );
	}

	wr.print( '</svg>' );

	wr.close();
}

function drawTileShapes( M )
{
	fill( 255 );
	stroke( 0 );
	strokeWeight( 1.0 );
	strokeJoin( ROUND );

	for( let t of tiles ) {
		if( grid.getGroup( t.vertex ) != -1 ) {
			fill( 128 );
		} else {
			fill( 255 );
		}

		beginShape();
		for( let pt of t.path ) {
			var wpt = mul( M, pt );
			vertex( wpt.x, wpt.y );
		}
		endShape( CLOSE );
	}
}

function draw()
{

	background( 255 );

	var xmin = 100000.0;
	var xmax = -100000.0;
	var ymin = 100000.0;
	var ymax = -100000.0;

	for( let pt of boundary ) {
		xmin = min( xmin, pt.x );
		xmax = max( xmax, pt.x );
		ymin = min( ymin, pt.y );
		ymax = max( ymax, pt.y );
	}

	const cbox = makeBox( xmin, ymin, xmax-xmin, ymax-ymin );
	const sbox = makeBox( 60, 60, width-120, height-120 );
	const M = fillBox( cbox, sbox, !DEBUG );

	if( DEBUG ) {
		if( MODE == 1 ) {
			drawLines( false );
			noLoop();
			return;
		} else if( MODE == 2 ) {
			// Draw small polygons around each vertex
			drawLines( true );
			noLoop();
			return;
		} else if( MODE == 3 ) {
			// Draw just the tiling
			drawTileShapes( M );
			noLoop();
			return;
		}
	}

	for( let t of tiles ) {
		drawTile( M, t.path );
	}

	noLoop();
}

function windowResized()
{
	// console.log( 'resize' );
	resizeCanvas( windowWidth, windowHeight );
	loop();
}

function keyPressed()
{
	if( key == 's' ) {
		exportSVG();
	} else if( key == ' ' ) {
		newDesign();
		loop();
	}
	if( DEBUG ) {
		if( key == '1' ) {
			MODE = 1;
		} else if( key == '2' ) {
			MODE = 2;
		} else if( key == '3' ) {
			MODE = 3;
		} else if( key == '0' ) {
			MODE = 0;
		} else {
			return;
		}
		loop();
	}
}
