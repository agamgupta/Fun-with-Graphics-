// Reference taken from the starter code "BasicShapes.js" provide by Professor J.Tumbling

// Vertex shader program - To convert our math to data on the coordinate axis.
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program-- To provide colors to each and every pixel drawn using 
//                            the VSHADER 
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variables
var ANGLE_STEP = 45.0;    // Rotation angle rate (degrees/second)
var floatsPerVertex = 7;  // # of Float32Array elements used for each vertex
                          // (x,y,z,w)position + (r,g,b)color

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  console.log('Hey! we have all our shaders initialized!');

  // Initialize vertex buffers
  var n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 1.0, 1.0, 0.5);

   // NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
  // unless the new Z value is closer to the eye than the old one..
  gl.depthFunc(gl.LESS);       // WebGL default setting: (default)
  gl.enable(gl.DEPTH_TEST);     
  
  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
  
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;

//-----------------  

  // Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw shapes
    // report current angle on console
    //console.log('currentAngle=',currentAngle);
    requestAnimationFrame(tick, canvas);   
                      // Request that the browser re-draw the webpage
  };
  tick();             // start (and continue) animation: draw current image
  
}

function initVertexBuffer(gl) {
//==============================================================================
// Create one giant vertex buffer object (VBO) that holds all vertices for all
// shapes.
 
  // Make each 3D shape in its own array of vertices:
  // makeCylinder();          // create, fill the cylVerts array
  makeSphere();           // create, fill the sphVerts array
  //makeSphere();
  
  // how many floats total needed to store all shapes?
  var mySiz = (sphVerts.length);

  // How many vertices total?
  var nn = mySiz / floatsPerVertex;
  console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
  // Copy all shapes into one big Float32 array:
  var colorShapes = new Float32Array(mySiz);
  // Copy them:  remember where to start for each shape:
  sphStart = 0;
  for(i=0,j=0; j< sphVerts.length; i++,j++) {
    colorShapes[i] = sphVerts[j];
  }

/*
  cylStart = 0;             // we stored the cylinder first.
  for(i=0,j=0; j< cylVerts.length; i++,j++) {
    colorShapes[i] = cylVerts[j];
    }
    sphStart = 1;           // next, we'll store the sphere;
  for(j=0; j< sphVerts.length; i++, j++) {// don't initialize i -- reuse it!
    colorShapes[i] = sphVerts[j];
    }
*/
  // Create a buffer object on the graphics hardware:
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

  // Use handle to specify how to retrieve **POSITION** data from our VBO:
  gl.vertexAttribPointer(
      a_Position,   // choose Vertex Shader attribute to fill with data
      4,            // how many values? 1,2,3 or 4.  (we're using x,y,z,w)
      gl.FLOAT,     // data type for each value: usually gl.FLOAT
      false,        // did we supply fixed-point data AND it needs normalizing?
      FSIZE * floatsPerVertex, // Stride -- how many bytes used to store each vertex?
                    // (x,y,z,w, r,g,b) * bytes/value
      0);           // Offset -- now many bytes from START of buffer to the
                    // value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
                    // Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve **COLOR** data from our VBO:
  gl.vertexAttribPointer(
    a_Color,        // choose Vertex Shader attribute to fill with data
    3,              // how many values? 1,2,3 or 4. (we're using R,G,B)
    gl.FLOAT,       // data type for each value: usually gl.FLOAT
    false,          // did we supply fixed-point data AND it needs normalizing?
    FSIZE * 7,      // Stride -- how many bytes used to store each vertex?
                    // (x,y,z,w, r,g,b) * bytes/value
    FSIZE * 4);     // Offset -- how many bytes from START of buffer to the
                    // value we will actually use?  Need to skip over x,y,z,w
                    
  gl.enableVertexAttribArray(a_Color);  
                    // Enable assignment of vertex buffer object's position data

  //--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}


/*function makeCylinder() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var ctrColr = new Float32Array([0.2, 0.2, 0.2]); // dark gray
 var topColr = new Float32Array([0.4, 0.7, 0.4]); // light green
 var botColr = new Float32Array([0.5, 0.5, 1.0]); // light blue
 var capVerts = 16; // # of vertices around the topmost 'cap' of the shape
 var botRadius = 1.6;   // radius of bottom of cylinder (top always 1.0)
 
 // Create a (global) array to hold this cylinder's vertices;
 cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
                    // # of vertices * # of elements needed to store them. 

  // Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
  // v counts vertices: j counts array elements (vertices * elements per vertex)
  for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {  
    // skip the first vertex--not needed.
    if(v%2==0)
    {       // put even# vertices at center of cylinder's top cap:
      cylVerts[j  ] = 0.0;      // x,y,z,w == 0,0,1,1
      cylVerts[j+1] = 0.0;  
      cylVerts[j+2] = 1.0; 
      cylVerts[j+3] = 1.0;      // r,g,b = topColr[]
      cylVerts[j+4]=ctrColr[0]; 
      cylVerts[j+5]=ctrColr[1]; 
      cylVerts[j+6]=ctrColr[2];
    }
    else {  // put odd# vertices around the top cap's outer edge;
            // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
            //          theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
      cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);     // x
      cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);     // y
      //  (Why not 2*PI? because 0 < =v < 2*capVerts, so we
      //   can simplify cos(2*PI * (v-1)/(2*capVerts))
      cylVerts[j+2] = 1.0;  // z
      cylVerts[j+3] = 1.0;  // w.
      // r,g,b = topColr[]
      cylVerts[j+4]=topColr[0]; 
      cylVerts[j+5]=topColr[1]; 
      cylVerts[j+6]=topColr[2];     
    }
  }
  // Create the cylinder side walls, made of 2*capVerts vertices.
  // v counts vertices within the wall; j continues to count array elements
  for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
    if(v%2==0)  // position all even# vertices along top cap:
    {   
        cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);   // x
        cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);   // y
        cylVerts[j+2] = 1.0;  // z
        cylVerts[j+3] = 1.0;  // w.
        // r,g,b = topColr[]
        cylVerts[j+4]=topColr[0]; 
        cylVerts[j+5]=topColr[1]; 
        cylVerts[j+6]=topColr[2];     
    }
    else    // position all odd# vertices along the bottom cap:
    {
        cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);   // x
        cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);   // y
        cylVerts[j+2] =-1.0;  // z
        cylVerts[j+3] = 1.0;  // w.
        // r,g,b = topColr[]
        cylVerts[j+4]=botColr[0]; 
        cylVerts[j+5]=botColr[1]; 
        cylVerts[j+6]=botColr[2];     
    }
  }
  // Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
  // v counts the vertices in the cap; j continues to count array elements
  for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
    if(v%2==0) {  // position even #'d vertices around bot cap's outer edge
      cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);   // x
      cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);   // y
      cylVerts[j+2] =-1.0;  // z
      cylVerts[j+3] = 1.0;  // w.
      // r,g,b = topColr[]
      cylVerts[j+4]=botColr[0]; 
      cylVerts[j+5]=botColr[1]; 
      cylVerts[j+6]=botColr[2];   
    }
    else {        // position odd#'d vertices at center of the bottom cap:
      cylVerts[j  ] = 0.0;      // x,y,z,w == 0,0,-1,1
      cylVerts[j+1] = 0.0;  
      cylVerts[j+2] =-1.0; 
      cylVerts[j+3] = 1.0;      // r,g,b = botColr[]
      cylVerts[j+4]=botColr[0]; 
      cylVerts[j+5]=botColr[1]; 
      cylVerts[j+6]=botColr[2];
    }
  }
}
*/
function makeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 13;    // # of slices of the sphere along the z axis. >=3 req'd
                      // (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts  = 27; // # of vertices around the top edge of the slice
                      // (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.7, 0.7, 0.7]);  // North Pole: light gray
  var equColr = new Float32Array([0.3, 0.7, 0.3]);  // Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);  // South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;  // lattitude angle spanned by one slice.

  // Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
                    // # of vertices * # of elements needed to store them. 
                    // each slice requires 2*sliceVerts vertices except 1st and
                    // last ones, which require only 2*sliceVerts-1.
                    
  // Create dome-shaped top slice of sphere at z=+1
  // s counts slices; v counts vertices; 
  // j counts array elements (vertices * elements per vertex)
  var cos0 = 0.0;         // sines,cosines of slice's top, bottom edge.
  var sin0 = 0.0;
  var cos1 = 0.0;
  var sin1 = 0.0; 
  var j = 0;              // initialize our array index
  var isLast = 0;
  var isFirst = 1;
  for(s=0; s<slices; s++) { // for each slice of the sphere,
    // find sines & cosines for top and bottom of this slice
    if(s==0) {
      isFirst = 1;  // skip 1st vertex of 1st slice.
      cos0 = 1.0;   // initialize: start at north pole.
      sin0 = 0.0;
    }
    else {          // otherwise, new top edge == old bottom edge
      isFirst = 0;  
      cos0 = cos1;
      sin0 = sin1;
    }               // & compute sine,cosine for new bottom edge.
    cos1 = Math.cos((s+1)*sliceAngle);
    sin1 = Math.sin((s+1)*sliceAngle);
    // go around the entire slice, generating TRIANGLE_STRIP verts
    // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
    if(s==slices-1) isLast=1; // skip last vertex of last slice.
    for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) { 
      if(v%2==0)
      {       // put even# vertices at the the slice's top edge
              // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
              // and thus we can simplify cos(2*PI(v/2*sliceVerts))  
        sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);  
        sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);  
        sphVerts[j+2] = cos0;   
        sphVerts[j+3] = 1.0;      
      }
      else {  // put odd# vertices around the slice's lower edge;
              // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
              //          theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
        sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);    // x
        sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);    // y
        sphVerts[j+2] = cos1;                                       // z
        sphVerts[j+3] = 1.0;                                        // w.   
      }
      if(s==0) {  // finally, set some interesting colors for vertices:
        sphVerts[j+4]=topColr[0]; 
        sphVerts[j+5]=topColr[1]; 
        sphVerts[j+6]=topColr[2]; 
        }
      else if(s==slices-1) {
        sphVerts[j+4]=botColr[0]; 
        sphVerts[j+5]=botColr[1]; 
        sphVerts[j+6]=botColr[2]; 
      }
      else {
          sphVerts[j+4]=Math.random();// equColr[0]; 
          sphVerts[j+5]=Math.random();// equColr[1]; 
          sphVerts[j+6]=Math.random();// equColr[2];          
      }
    }
  }
}


function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  /*//-------Draw Spinning Cylinder:
  modelMatrix.setTranslate(-0.4,-0.4, 0.0);  // 'set' means DISCARD old matrix,
              // (drawing axes centered in CVV), and then make new
              // drawing axes moved to the lower-left corner of CVV. 
  modelMatrix.scale(1,1,-1);              // convert to left-handed coord sys
                                          // to match WebGL display canvas.
  modelMatrix.scale(0.2, 0.2, 0.2);
              // if you DON'T scale, cyl goes outside the CVV; clipped!
  modelMatrix.rotate(currentAngle, 0, 1, 0);  // spin around y axis.
  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.
  
  */
  //--------Draw Spinning Sphere
  modelMatrix.setTranslate( 0.0, -0.3, 0.0); // 'set' means DISCARD old matrix,
              // (drawing axes centered in CVV), and then make new
              // drawing axes moved to the lower-left corner of CVV.
  modelMatrix.scale(1,1,-1);              // convert to left-handed coord sys
                                          // to match WebGL display canvas.
  modelMatrix.scale(0.4, 0.4, 0.4);
              // Make it smaller:
  modelMatrix.rotate(currentAngle, 0, 1, 0);  // Spin on XY diagonal axis
  // Drawing:   
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      // Draw just the sphere's vertices
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                sphStart/floatsPerVertex, // start at this vertex number, and 
                sphVerts.length/floatsPerVertex); // draw this many vertices.
}


// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
//  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
//  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

//==================HTML Button Callbacks
function nextShape() {
  shapeNum += 1;
  if(shapeNum >= shapeMax) shapeNum = 0;
}

function spinDown() {
 ANGLE_STEP -= 25; 
}

function spinUp() {
  ANGLE_STEP += 25; 
}

function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
  }
  else {
    ANGLE_STEP = myTmp;
  }
}
