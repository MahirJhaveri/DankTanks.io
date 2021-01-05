/**
 * Functions for collision detection using the Separating Axis Theorem. (2D supported only)
 * SAT is used for collision detection between 2 convex polygons OR a convex
 * polygon and a circle.
 */

/** 
 * Takes in 2 points and returns the vector perpendicular to the line joining them.
 * (Technically, this should be a unit vector, but not necessary since we are only
 * comparing magnitudes.)
*/
function computeNormal(p1, p2) {
    const v = [p1[0]-p2[0], p1[1]-p2[1]];
    return [v[1], -1*v[0]];
}

/** Returns the dot product of v1 with v2 */
function dot(v1, v2) {
    return v1[0]*v2[0] + v1[1]*v2[1];
}

/** Returns the projection of v1 onto v2. */
function computeProjection(v1, v2) {
    return dot(v1, v2);
}

/** 
 * Returns the min and max values after projecting all vectors onto the baseVector.
*/
function getMinMax(vectors, baseVector) {
    var min = Infinity;
    var max = -1*Infinity;
    for(var i = 0; i < vectors.length; i++) {
        const p = computeProjection(vectors[i], baseVector);
        min = (p < min) ? p : min;
        max = (p > max) ? p : max;
    }
    return [min, max];
}

/**
 * Returns true if the convex polygons represented by vertices1 and vertices2
 * are separable.
 * 
 * The ids are used to cache intermediate results, so that recomputation is
 * avoided. 
 */
function isSeparableAux(id1, vertices1, id2, vertices2, cache) {
    // compute normals for vertices1
    var normals1 = undefined;
    if(id1 && cache && cache[id1]) {
        normals1 = cache[id1];
    } else {
        normals1 = [];
        var i = 0;
        while(i < vertices1.length-1) {
            normals1.push(computeNormal(vertices1[i], vertices1[i+1]));
            i++;
        }
        if(cache && id1) {
            cache[id1] = normals1;
        }
    }

    // compute normals for vertices2
    var normals2 = undefined;
    if(id2 && cache && cache[id2]) {
        normals2 = cache[id2];
    } else {
        normals2 = [];
        var i = 0;
        while(i < vertices2.length-1) {
            normals2.push(computeNormal(vertices2[i], vertices2[i+1]));
            i++;
        }
        if(cache && id2) {
            cache[id2] = normals2;
        }
    }

    /* NOTE - Try to use caching to save some more effort in computing Min&Max */

    for(var i = 0; i < normals1.length; i++) {
        var [min1, max1] = getMinMax(vertices1, normals1[i]);
        var [min2, max2] = getMinMax(vertices2, normals1[i]);

        if(max1 < min2 || max2 < min1) {
            return true;
        }
    }
    for(var i = 0; i < normals2.length; i++) {
        var [min1, max1] = getMinMax(vertices1, normals2[i]);
        var [min2, max2] = getMinMax(vertices2, normals2[i]);

        if(max1 < min2 || max2 < min1) {
            return true;
        }
    }

    return false;
}

/**
 * Returns true if the convex polygon given by vertices and the circle given by
 * (center, radius) are separable.
 * 
 * Sqaure bounding box will be used to approximate the circle
 */
function isSeparable(id, vertices, center, radius, cache) {
    var boundingBox = [];
    const temp = [[1,1],[1,-1],[-1,-1],[-1,1],[1,1]];
    var i = 0;
    while(i < temp.length) {
        boundingBox.push([center[0]+temp[i][0]*radius, center[1]+temp[i][1]*radius]);
        i++;
    }
    return isSeparableAux(id, vertices, "boundingBoxNormals", boundingBox, cache);
}

module.exports = isSeparable