/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* global AFRAME, THREE */
	if (typeof AFRAME === 'undefined') {
	  throw new Error('Component attempted to register before AFRAME was available.');
	}

	var createText = __webpack_require__(1);
	var loadFont = __webpack_require__(17);
	var SDFShader = __webpack_require__(36);

	/**
	 * bmfont text component for A-Frame.
	 */
	AFRAME.registerComponent('bmfont-text', {
	  schema: {
	    text: {
	      type: 'string'
	    },
	    width: {
	      type: 'number',
	      default: 1000
	    },
	    align: {
	      type: 'string',
	      default: 'left'
	    },
	    letterSpacing: {
	      type: 'number',
	      default: 0
	    },
	    fnt: {
	      type: 'string',
	      default: 'https://cdn.rawgit.com/bryik/aframe-bmfont-text-component/aa0655cf90f646e12c40ab4708ea90b4686cfb45/assets/DejaVu-sdf.fnt'
	    },
	    fntImage: {
	      type: 'string',
	      default: 'https://cdn.rawgit.com/bryik/aframe-bmfont-text-component/aa0655cf90f646e12c40ab4708ea90b4686cfb45/assets/DejaVu-sdf.png'
	    },
	    mode: {
	      type: 'string',
	      default: 'normal'
	    },
	    color: {
	      type: 'color',
	      default: '#000'
	    }
	  },

	  /**
	   * Called when component is attached and when component data changes.
	   * Generally modifies the entity based on the data.
	   */
	  update: function (oldData) {
	    // Entity data
	    var el = this.el;
	    var object3D = el.object3D;
	    var data = this.data;

	    // Use fontLoader utility to load 'fnt' and texture
	    fontLoader({
	      font: data.fnt,
	      image: data.fntImage
	    }, start);

	    function start (font, texture) {
	      // Setup texture, should set anisotropy to user maximum...
	      texture.needsUpdate = true;
	      texture.anisotropy = 16;

	      var options = {
	        font: font, // the bitmap font definition
	        text: data.text, // the string to render
	        width: data.width,
	        align: data.left,
	        letterSpacing: data.letterSpacing,
	        mode: data.mode
	      };

	      // Create text geometry
	      var geometry = createText(options);

	      // Use './lib/shaders/sdf' to help build a shader material
	      var material = new THREE.RawShaderMaterial(SDFShader({
	        map: texture,
	        side: THREE.DoubleSide,
	        transparent: true,
	        color: data.color
	      }));

	      var text = new THREE.Mesh(geometry, material);

	      // Rotate so text faces the camera
	      text.rotation.y = Math.PI;

	      // Scale text down
	      text.scale.multiplyScalar(-0.005);

	      object3D.add(text);
	    }
	  }
	});

	/**
	 * A utility to load a font with bmfont-load
	 * and a texture with Three.TextureLoader()
	 */
	function fontLoader (opt, cb) {
	  loadFont(opt.font, function (err, font) {
	    if (err) {
	      throw err;
	    }

	    var textureLoader = new THREE.TextureLoader();
	    textureLoader.load(opt.image, function (texture) {
	      cb(font, texture);
	    });
	  });
	}


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var createLayout = __webpack_require__(2)
	var inherits = __webpack_require__(7)
	var createIndices = __webpack_require__(8)
	var buffer = __webpack_require__(12)
	var assign = __webpack_require__(14)

	var vertices = __webpack_require__(15)
	var utils = __webpack_require__(16)

	var Base = THREE.BufferGeometry

	module.exports = function createTextGeometry (opt) {
	  return new TextGeometry(opt)
	}

	function TextGeometry (opt) {
	  Base.call(this)

	  if (typeof opt === 'string') {
	    opt = { text: opt }
	  }

	  // use these as default values for any subsequent
	  // calls to update()
	  this._opt = assign({}, opt)

	  // also do an initial setup...
	  if (opt) this.update(opt)
	}

	inherits(TextGeometry, Base)

	TextGeometry.prototype.update = function (opt) {
	  if (typeof opt === 'string') {
	    opt = { text: opt }
	  }

	  // use constructor defaults
	  opt = assign({}, this._opt, opt)

	  if (!opt.font) {
	    throw new TypeError('must specify a { font } in options')
	  }

	  this.layout = createLayout(opt)

	  // get vec2 texcoords
	  var flipY = opt.flipY !== false

	  // the desired BMFont data
	  var font = opt.font

	  // determine texture size from font file
	  var texWidth = font.common.scaleW
	  var texHeight = font.common.scaleH

	  // get visible glyphs
	  var glyphs = this.layout.glyphs.filter(function (glyph) {
	    var bitmap = glyph.data
	    return bitmap.width * bitmap.height > 0
	  })

	  // provide visible glyphs for convenience
	  this.visibleGlyphs = glyphs

	  // get common vertex data
	  var positions = vertices.positions(glyphs)
	  var uvs = vertices.uvs(glyphs, texWidth, texHeight, flipY)
	  var indices = createIndices({
	    clockwise: true,
	    type: 'uint16',
	    count: glyphs.length
	  })

	  // update vertex data
	  buffer.index(this, indices, 1, 'uint16')
	  buffer.attr(this, 'position', positions, 2)
	  buffer.attr(this, 'uv', uvs, 2)

	  // update multipage data
	  if (!opt.multipage && 'page' in this.attributes) {
	    // disable multipage rendering
	    this.removeAttribute('page')
	  } else if (opt.multipage) {
	    var pages = vertices.pages(glyphs)
	    // enable multipage rendering
	    buffer.attr(this, 'page', pages, 1)
	  }
	}

	TextGeometry.prototype.computeBoundingSphere = function () {
	  if (this.boundingSphere === null) {
	    this.boundingSphere = new THREE.Sphere()
	  }

	  var positions = this.attributes.position.array
	  var itemSize = this.attributes.position.itemSize
	  if (!positions || !itemSize || positions.length < 2) {
	    this.boundingSphere.radius = 0
	    this.boundingSphere.center.set(0, 0, 0)
	    return
	  }
	  utils.computeSphere(positions, this.boundingSphere)
	  if (isNaN(this.boundingSphere.radius)) {
	    console.error('THREE.BufferGeometry.computeBoundingSphere(): ' +
	      'Computed radius is NaN. The ' +
	      '"position" attribute is likely to have NaN values.')
	  }
	}

	TextGeometry.prototype.computeBoundingBox = function () {
	  if (this.boundingBox === null) {
	    this.boundingBox = new THREE.Box3()
	  }

	  var bbox = this.boundingBox
	  var positions = this.attributes.position.array
	  var itemSize = this.attributes.position.itemSize
	  if (!positions || !itemSize || positions.length < 2) {
	    bbox.makeEmpty()
	    return
	  }
	  utils.computeBox(positions, bbox)
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var wordWrap = __webpack_require__(3)
	var xtend = __webpack_require__(4)
	var findChar = __webpack_require__(5)('id')
	var number = __webpack_require__(6)

	var X_HEIGHTS = ['x', 'e', 'a', 'o', 'n', 's', 'r', 'c', 'u', 'm', 'v', 'w', 'z']
	var M_WIDTHS = ['m', 'w']
	var CAP_HEIGHTS = ['H', 'I', 'N', 'E', 'F', 'K', 'L', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']


	var TAB_ID = '\t'.charCodeAt(0)
	var SPACE_ID = ' '.charCodeAt(0)
	var ALIGN_LEFT = 0, 
	    ALIGN_CENTER = 1, 
	    ALIGN_RIGHT = 2

	module.exports = function createLayout(opt) {
	  return new TextLayout(opt)
	}

	function TextLayout(opt) {
	  this.glyphs = []
	  this._measure = this.computeMetrics.bind(this)
	  this.update(opt)
	}

	TextLayout.prototype.update = function(opt) {
	  opt = xtend({
	    measure: this._measure
	  }, opt)
	  this._opt = opt
	  this._opt.tabSize = number(this._opt.tabSize, 4)

	  if (!opt.font)
	    throw new Error('must provide a valid bitmap font')

	  var glyphs = this.glyphs
	  var text = opt.text||'' 
	  var font = opt.font
	  this._setupSpaceGlyphs(font)
	  
	  var lines = wordWrap.lines(text, opt)
	  var minWidth = opt.width || 0

	  //clear glyphs
	  glyphs.length = 0

	  //get max line width
	  var maxLineWidth = lines.reduce(function(prev, line) {
	    return Math.max(prev, line.width, minWidth)
	  }, 0)

	  //the pen position
	  var x = 0
	  var y = 0
	  var lineHeight = number(opt.lineHeight, font.common.lineHeight)
	  var baseline = font.common.base
	  var descender = lineHeight-baseline
	  var letterSpacing = opt.letterSpacing || 0
	  var height = lineHeight * lines.length - descender
	  var align = getAlignType(this._opt.align)

	  //draw text along baseline
	  y -= height
	  
	  //the metrics for this text layout
	  this._width = maxLineWidth
	  this._height = height
	  this._descender = lineHeight - baseline
	  this._baseline = baseline
	  this._xHeight = getXHeight(font)
	  this._capHeight = getCapHeight(font)
	  this._lineHeight = lineHeight
	  this._ascender = lineHeight - descender - this._xHeight
	    
	  //layout each glyph
	  var self = this
	  lines.forEach(function(line, lineIndex) {
	    var start = line.start
	    var end = line.end
	    var lineWidth = line.width
	    var lastGlyph
	    
	    //for each glyph in that line...
	    for (var i=start; i<end; i++) {
	      var id = text.charCodeAt(i)
	      var glyph = self.getGlyph(font, id)
	      if (glyph) {
	        if (lastGlyph) 
	          x += getKerning(font, lastGlyph.id, glyph.id)

	        var tx = x
	        if (align === ALIGN_CENTER) 
	          tx += (maxLineWidth-lineWidth)/2
	        else if (align === ALIGN_RIGHT)
	          tx += (maxLineWidth-lineWidth)

	        glyphs.push({
	          position: [tx, y],
	          data: glyph,
	          index: i,
	          line: lineIndex
	        })  

	        //move pen forward
	        x += glyph.xadvance + letterSpacing
	        lastGlyph = glyph
	      }
	    }

	    //next line down
	    y += lineHeight
	    x = 0
	  })
	  this._linesTotal = lines.length;
	}

	TextLayout.prototype._setupSpaceGlyphs = function(font) {
	  //These are fallbacks, when the font doesn't include
	  //' ' or '\t' glyphs
	  this._fallbackSpaceGlyph = null
	  this._fallbackTabGlyph = null

	  if (!font.chars || font.chars.length === 0)
	    return

	  //try to get space glyph
	  //then fall back to the 'm' or 'w' glyphs
	  //then fall back to the first glyph available
	  var space = getGlyphById(font, SPACE_ID) 
	          || getMGlyph(font) 
	          || font.chars[0]

	  //and create a fallback for tab
	  var tabWidth = this._opt.tabSize * space.xadvance
	  this._fallbackSpaceGlyph = space
	  this._fallbackTabGlyph = xtend(space, {
	    x: 0, y: 0, xadvance: tabWidth, id: TAB_ID, 
	    xoffset: 0, yoffset: 0, width: 0, height: 0
	  })
	}

	TextLayout.prototype.getGlyph = function(font, id) {
	  var glyph = getGlyphById(font, id)
	  if (glyph)
	    return glyph
	  else if (id === TAB_ID) 
	    return this._fallbackTabGlyph
	  else if (id === SPACE_ID) 
	    return this._fallbackSpaceGlyph
	  return null
	}

	TextLayout.prototype.computeMetrics = function(text, start, end, width) {
	  var letterSpacing = this._opt.letterSpacing || 0
	  var font = this._opt.font
	  var curPen = 0
	  var curWidth = 0
	  var count = 0
	  var glyph
	  var lastGlyph

	  if (!font.chars || font.chars.length === 0) {
	    return {
	      start: start,
	      end: start,
	      width: 0
	    }
	  }

	  end = Math.min(text.length, end)
	  for (var i=start; i < end; i++) {
	    var id = text.charCodeAt(i)
	    var glyph = this.getGlyph(font, id)

	    if (glyph) {
	      //move pen forward
	      var xoff = glyph.xoffset
	      var kern = lastGlyph ? getKerning(font, lastGlyph.id, glyph.id) : 0
	      curPen += kern

	      var nextPen = curPen + glyph.xadvance + letterSpacing
	      var nextWidth = curPen + glyph.width

	      //we've hit our limit; we can't move onto the next glyph
	      if (nextWidth >= width || nextPen >= width)
	        break

	      //otherwise continue along our line
	      curPen = nextPen
	      curWidth = nextWidth
	      lastGlyph = glyph
	    }
	    count++
	  }
	  
	  //make sure rightmost edge lines up with rendered glyphs
	  if (lastGlyph)
	    curWidth += lastGlyph.xoffset

	  return {
	    start: start,
	    end: start + count,
	    width: curWidth
	  }
	}

	//getters for the private vars
	;['width', 'height', 
	  'descender', 'ascender',
	  'xHeight', 'baseline',
	  'capHeight',
	  'lineHeight' ].forEach(addGetter)

	function addGetter(name) {
	  Object.defineProperty(TextLayout.prototype, name, {
	    get: wrapper(name),
	    configurable: true
	  })
	}

	//create lookups for private vars
	function wrapper(name) {
	  return (new Function([
	    'return function '+name+'() {',
	    '  return this._'+name,
	    '}'
	  ].join('\n')))()
	}

	function getGlyphById(font, id) {
	  if (!font.chars || font.chars.length === 0)
	    return null

	  var glyphIdx = findChar(font.chars, id)
	  if (glyphIdx >= 0)
	    return font.chars[glyphIdx]
	  return null
	}

	function getXHeight(font) {
	  for (var i=0; i<X_HEIGHTS.length; i++) {
	    var id = X_HEIGHTS[i].charCodeAt(0)
	    var idx = findChar(font.chars, id)
	    if (idx >= 0) 
	      return font.chars[idx].height
	  }
	  return 0
	}

	function getMGlyph(font) {
	  for (var i=0; i<M_WIDTHS.length; i++) {
	    var id = M_WIDTHS[i].charCodeAt(0)
	    var idx = findChar(font.chars, id)
	    if (idx >= 0) 
	      return font.chars[idx]
	  }
	  return 0
	}

	function getCapHeight(font) {
	  for (var i=0; i<CAP_HEIGHTS.length; i++) {
	    var id = CAP_HEIGHTS[i].charCodeAt(0)
	    var idx = findChar(font.chars, id)
	    if (idx >= 0) 
	      return font.chars[idx].height
	  }
	  return 0
	}

	function getKerning(font, left, right) {
	  if (!font.kernings || font.kernings.length === 0)
	    return 0

	  var table = font.kernings
	  for (var i=0; i<table.length; i++) {
	    var kern = table[i]
	    if (kern.first === left && kern.second === right)
	      return kern.amount
	  }
	  return 0
	}

	function getAlignType(align) {
	  if (align === 'center')
	    return ALIGN_CENTER
	  else if (align === 'right')
	    return ALIGN_RIGHT
	  return ALIGN_LEFT
	}

/***/ },
/* 3 */
/***/ function(module, exports) {

	var newline = /\n/
	var newlineChar = '\n'
	var whitespace = /\s/

	module.exports = function(text, opt) {
	    var lines = module.exports.lines(text, opt)
	    return lines.map(function(line) {
	        return text.substring(line.start, line.end)
	    }).join('\n')
	}

	module.exports.lines = function wordwrap(text, opt) {
	    opt = opt||{}

	    //zero width results in nothing visible
	    if (opt.width === 0 && opt.mode !== 'nowrap') 
	        return []

	    text = text||''
	    var width = typeof opt.width === 'number' ? opt.width : Number.MAX_VALUE
	    var start = Math.max(0, opt.start||0)
	    var end = typeof opt.end === 'number' ? opt.end : text.length
	    var mode = opt.mode

	    var measure = opt.measure || monospace
	    if (mode === 'pre')
	        return pre(measure, text, start, end, width)
	    else
	        return greedy(measure, text, start, end, width, mode)
	}

	function idxOf(text, chr, start, end) {
	    var idx = text.indexOf(chr, start)
	    if (idx === -1 || idx > end)
	        return end
	    return idx
	}

	function isWhitespace(chr) {
	    return whitespace.test(chr)
	}

	function pre(measure, text, start, end, width) {
	    var lines = []
	    var lineStart = start
	    for (var i=start; i<end && i<text.length; i++) {
	        var chr = text.charAt(i)
	        var isNewline = newline.test(chr)

	        //If we've reached a newline, then step down a line
	        //Or if we've reached the EOF
	        if (isNewline || i===end-1) {
	            var lineEnd = isNewline ? i : i+1
	            var measured = measure(text, lineStart, lineEnd, width)
	            lines.push(measured)
	            
	            lineStart = i+1
	        }
	    }
	    return lines
	}

	function greedy(measure, text, start, end, width, mode) {
	    //A greedy word wrapper based on LibGDX algorithm
	    //https://github.com/libgdx/libgdx/blob/master/gdx/src/com/badlogic/gdx/graphics/g2d/BitmapFontCache.java
	    var lines = []

	    var testWidth = width
	    //if 'nowrap' is specified, we only wrap on newline chars
	    if (mode === 'nowrap')
	        testWidth = Number.MAX_VALUE

	    while (start < end && start < text.length) {
	        //get next newline position
	        var newLine = idxOf(text, newlineChar, start, end)

	        //eat whitespace at start of line
	        while (start < newLine) {
	            if (!isWhitespace( text.charAt(start) ))
	                break
	            start++
	        }

	        //determine visible # of glyphs for the available width
	        var measured = measure(text, start, newLine, testWidth)

	        var lineEnd = start + (measured.end-measured.start)
	        var nextStart = lineEnd + newlineChar.length

	        //if we had to cut the line before the next newline...
	        if (lineEnd < newLine) {
	            //find char to break on
	            while (lineEnd > start) {
	                if (isWhitespace(text.charAt(lineEnd)))
	                    break
	                lineEnd--
	            }
	            if (lineEnd === start) {
	                if (nextStart > start + newlineChar.length) nextStart--
	                lineEnd = nextStart // If no characters to break, show all.
	            } else {
	                nextStart = lineEnd
	                //eat whitespace at end of line
	                while (lineEnd > start) {
	                    if (!isWhitespace(text.charAt(lineEnd - newlineChar.length)))
	                        break
	                    lineEnd--
	                }
	            }
	        }
	        if (lineEnd >= start) {
	            var result = measure(text, start, lineEnd, testWidth)
	            lines.push(result)
	        }
	        start = nextStart
	    }
	    return lines
	}

	//determines the visible number of glyphs within a given width
	function monospace(text, start, end, width) {
	    var glyphs = Math.min(width, end-start)
	    return {
	        start: start,
	        end: start+glyphs
	    }
	}

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = extend

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	function extend() {
	    var target = {}

	    for (var i = 0; i < arguments.length; i++) {
	        var source = arguments[i]

	        for (var key in source) {
	            if (hasOwnProperty.call(source, key)) {
	                target[key] = source[key]
	            }
	        }
	    }

	    return target
	}


/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = function compile(property) {
		if (!property || typeof property !== 'string')
			throw new Error('must specify property for indexof search')

		return new Function('array', 'value', 'start', [
			'start = start || 0',
			'for (var i=start; i<array.length; i++)',
			'  if (array[i]["' + property +'"] === value)',
			'      return i',
			'return -1'
		].join('\n'))
	}

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = function numtype(num, def) {
		return typeof num === 'number'
			? num 
			: (typeof def === 'number' ? def : 0)
	}

/***/ },
/* 7 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var dtype = __webpack_require__(9)
	var anArray = __webpack_require__(10)
	var isBuffer = __webpack_require__(11)

	var CW = [0, 2, 3]
	var CCW = [2, 1, 3]

	module.exports = function createQuadElements(array, opt) {
	    //if user didn't specify an output array
	    if (!array || !(anArray(array) || isBuffer(array))) {
	        opt = array || {}
	        array = null
	    }

	    if (typeof opt === 'number') //backwards-compatible
	        opt = { count: opt }
	    else
	        opt = opt || {}

	    var type = typeof opt.type === 'string' ? opt.type : 'uint16'
	    var count = typeof opt.count === 'number' ? opt.count : 1
	    var start = (opt.start || 0) 

	    var dir = opt.clockwise !== false ? CW : CCW,
	        a = dir[0], 
	        b = dir[1],
	        c = dir[2]

	    var numIndices = count * 6

	    var indices = array || new (dtype(type))(numIndices)
	    for (var i = 0, j = 0; i < numIndices; i += 6, j += 4) {
	        var x = i + start
	        indices[x + 0] = j + 0
	        indices[x + 1] = j + 1
	        indices[x + 2] = j + 2
	        indices[x + 3] = j + a
	        indices[x + 4] = j + b
	        indices[x + 5] = j + c
	    }
	    return indices
	}

/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = function(dtype) {
	  switch (dtype) {
	    case 'int8':
	      return Int8Array
	    case 'int16':
	      return Int16Array
	    case 'int32':
	      return Int32Array
	    case 'uint8':
	      return Uint8Array
	    case 'uint16':
	      return Uint16Array
	    case 'uint32':
	      return Uint32Array
	    case 'float32':
	      return Float32Array
	    case 'float64':
	      return Float64Array
	    case 'array':
	      return Array
	    case 'uint8_clamped':
	      return Uint8ClampedArray
	  }
	}


/***/ },
/* 10 */
/***/ function(module, exports) {

	var str = Object.prototype.toString

	module.exports = anArray

	function anArray(arr) {
	  return (
	       arr.BYTES_PER_ELEMENT
	    && str.call(arr.buffer) === '[object ArrayBuffer]'
	    || Array.isArray(arr)
	  )
	}


/***/ },
/* 11 */
/***/ function(module, exports) {

	/**
	 * Determine if an object is Buffer
	 *
	 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * License:  MIT
	 *
	 * `npm install is-buffer`
	 */

	module.exports = function (obj) {
	  return !!(obj != null &&
	    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
	      (obj.constructor &&
	      typeof obj.constructor.isBuffer === 'function' &&
	      obj.constructor.isBuffer(obj))
	    ))
	}


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var flatten = __webpack_require__(13)

	module.exports.attr = setAttribute
	module.exports.index = setIndex

	function setIndex (geometry, data, itemSize, dtype) {
	  if (typeof itemSize !== 'number') itemSize = 1
	  if (typeof dtype !== 'string') dtype = 'uint16'

	  var isR69 = !geometry.index && typeof geometry.setIndex !== 'function'
	  var attrib = isR69 ? geometry.getAttribute('index') : geometry.index
	  var newAttrib = updateAttribute(attrib, data, itemSize, dtype)
	  if (newAttrib) {
	    if (isR69) geometry.addAttribute('index', newAttrib)
	    else geometry.index = newAttrib
	  }
	}

	function setAttribute (geometry, key, data, itemSize, dtype) {
	  if (typeof itemSize !== 'number') itemSize = 3
	  if (typeof dtype !== 'string') dtype = 'float32'
	  if (Array.isArray(data) &&
	    Array.isArray(data[0]) &&
	    data[0].length !== itemSize) {
	    throw new Error('Nested vertex array has unexpected size; expected ' +
	      itemSize + ' but found ' + data[0].length)
	  }

	  var attrib = geometry.getAttribute(key)
	  var newAttrib = updateAttribute(attrib, data, itemSize, dtype)
	  if (newAttrib) {
	    geometry.addAttribute(key, newAttrib)
	  }
	}

	function updateAttribute (attrib, data, itemSize, dtype) {
	  data = data || []
	  if (!attrib || rebuildAttribute(attrib, data, itemSize)) {
	    // create a new array with desired type
	    data = flatten(data, dtype)
	    attrib = new THREE.BufferAttribute(data, itemSize)
	    attrib.needsUpdate = true
	    return attrib
	  } else {
	    // copy data into the existing array
	    flatten(data, attrib.array)
	    attrib.needsUpdate = true
	    return null
	  }
	}

	// Test whether the attribute needs to be re-created,
	// returns false if we can re-use it as-is.
	function rebuildAttribute (attrib, data, itemSize) {
	  if (attrib.itemSize !== itemSize) return true
	  if (!attrib.array) return true
	  var attribLength = attrib.array.length
	  if (Array.isArray(data) && Array.isArray(data[0])) {
	    // [ [ x, y, z ] ]
	    return attribLength !== data.length * itemSize
	  } else {
	    // [ x, y, z ]
	    return attribLength !== data.length
	  }
	  return false
	}


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/*eslint new-cap:0*/
	var dtype = __webpack_require__(9)
	module.exports = flattenVertexData
	function flattenVertexData (data, output, offset) {
	  if (!data) throw new TypeError('must specify data as first parameter')
	  offset = +(offset || 0) | 0

	  if (Array.isArray(data) && Array.isArray(data[0])) {
	    var dim = data[0].length
	    var length = data.length * dim

	    // no output specified, create a new typed array
	    if (!output || typeof output === 'string') {
	      output = new (dtype(output || 'float32'))(length + offset)
	    }

	    var dstLength = output.length - offset
	    if (length !== dstLength) {
	      throw new Error('source length ' + length + ' (' + dim + 'x' + data.length + ')' +
	        ' does not match destination length ' + dstLength)
	    }

	    for (var i = 0, k = offset; i < data.length; i++) {
	      for (var j = 0; j < dim; j++) {
	        output[k++] = data[i][j]
	      }
	    }
	  } else {
	    if (!output || typeof output === 'string') {
	      // no output, create a new one
	      var Ctor = dtype(output || 'float32')
	      if (offset === 0) {
	        output = new Ctor(data)
	      } else {
	        output = new Ctor(data.length + offset)
	        output.set(data, offset)
	      }
	    } else {
	      // store output in existing array
	      output.set(data, offset)
	    }
	  }

	  return output
	}


/***/ },
/* 14 */
/***/ function(module, exports) {

	'use strict';
	/* eslint-disable no-unused-vars */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function shouldUseNative() {
		try {
			if (!Object.assign) {
				return false;
			}

			// Detect buggy property enumeration order in older V8 versions.

			// https://bugs.chromium.org/p/v8/issues/detail?id=4118
			var test1 = new String('abc');  // eslint-disable-line
			test1[5] = 'de';
			if (Object.getOwnPropertyNames(test1)[0] === '5') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test2 = {};
			for (var i = 0; i < 10; i++) {
				test2['_' + String.fromCharCode(i)] = i;
			}
			var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
				return test2[n];
			});
			if (order2.join('') !== '0123456789') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test3 = {};
			'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join('') !==
					'abcdefghijklmnopqrst') {
				return false;
			}

			return true;
		} catch (e) {
			// We don't expect any of the above to throw, but better to be safe.
			return false;
		}
	}

	module.exports = shouldUseNative() ? Object.assign : function (target, source) {
		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (Object.getOwnPropertySymbols) {
				symbols = Object.getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};


/***/ },
/* 15 */
/***/ function(module, exports) {

	module.exports.pages = function pages (glyphs) {
	  var pages = new Float32Array(glyphs.length * 4 * 1)
	  var i = 0
	  glyphs.forEach(function (glyph) {
	    var id = glyph.data.page || 0
	    pages[i++] = id
	    pages[i++] = id
	    pages[i++] = id
	    pages[i++] = id
	  })
	  return pages
	}

	module.exports.uvs = function uvs (glyphs, texWidth, texHeight, flipY) {
	  var uvs = new Float32Array(glyphs.length * 4 * 2)
	  var i = 0
	  glyphs.forEach(function (glyph) {
	    var bitmap = glyph.data
	    var bw = (bitmap.x + bitmap.width)
	    var bh = (bitmap.y + bitmap.height)

	    // top left position
	    var u0 = bitmap.x / texWidth
	    var v1 = bitmap.y / texHeight
	    var u1 = bw / texWidth
	    var v0 = bh / texHeight

	    if (flipY) {
	      v1 = (texHeight - bitmap.y) / texHeight
	      v0 = (texHeight - bh) / texHeight
	    }

	    // BL
	    uvs[i++] = u0
	    uvs[i++] = v1
	    // TL
	    uvs[i++] = u0
	    uvs[i++] = v0
	    // TR
	    uvs[i++] = u1
	    uvs[i++] = v0
	    // BR
	    uvs[i++] = u1
	    uvs[i++] = v1
	  })
	  return uvs
	}

	module.exports.positions = function positions (glyphs) {
	  var positions = new Float32Array(glyphs.length * 4 * 2)
	  var i = 0
	  glyphs.forEach(function (glyph) {
	    var bitmap = glyph.data

	    // bottom left position
	    var x = glyph.position[0] + bitmap.xoffset
	    var y = glyph.position[1] + bitmap.yoffset

	    // quad size
	    var w = bitmap.width
	    var h = bitmap.height

	    // BL
	    positions[i++] = x
	    positions[i++] = y
	    // TL
	    positions[i++] = x
	    positions[i++] = y + h
	    // TR
	    positions[i++] = x + w
	    positions[i++] = y + h
	    // BR
	    positions[i++] = x + w
	    positions[i++] = y
	  })
	  return positions
	}


/***/ },
/* 16 */
/***/ function(module, exports) {

	var itemSize = 2
	var box = { min: [0, 0], max: [0, 0] }

	function bounds (positions) {
	  var count = positions.length / itemSize
	  box.min[0] = positions[0]
	  box.min[1] = positions[1]
	  box.max[0] = positions[0]
	  box.max[1] = positions[1]

	  for (var i = 0; i < count; i++) {
	    var x = positions[i * itemSize + 0]
	    var y = positions[i * itemSize + 1]
	    box.min[0] = Math.min(x, box.min[0])
	    box.min[1] = Math.min(y, box.min[1])
	    box.max[0] = Math.max(x, box.max[0])
	    box.max[1] = Math.max(y, box.max[1])
	  }
	}

	module.exports.computeBox = function (positions, output) {
	  bounds(positions)
	  output.min.set(box.min[0], box.min[1], 0)
	  output.max.set(box.max[0], box.max[1], 0)
	}

	module.exports.computeSphere = function (positions, output) {
	  bounds(positions)
	  var minX = box.min[0]
	  var minY = box.min[1]
	  var maxX = box.max[0]
	  var maxY = box.max[1]
	  var width = maxX - minX
	  var height = maxY - minY
	  var length = Math.sqrt(width * width + height * height)
	  output.center.set(minX + width / 2, minY + height / 2, 0)
	  output.radius = length / 2
	}


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var xhr = __webpack_require__(22)
	var noop = function(){}
	var parseASCII = __webpack_require__(29)
	var parseXML = __webpack_require__(30)
	var readBinary = __webpack_require__(33)
	var isBinaryFormat = __webpack_require__(34)
	var xtend = __webpack_require__(4)

	var xml2 = (function hasXML2() {
	  return window.XMLHttpRequest && "withCredentials" in new XMLHttpRequest
	})()

	module.exports = function(opt, cb) {
	  cb = typeof cb === 'function' ? cb : noop

	  if (typeof opt === 'string')
	    opt = { uri: opt }
	  else if (!opt)
	    opt = {}

	  var expectBinary = opt.binary
	  if (expectBinary)
	    opt = getBinaryOpts(opt)

	  xhr(opt, function(err, res, body) {
	    if (err)
	      return cb(err)
	    if (!/^2/.test(res.statusCode))
	      return cb(new Error('http status code: '+res.statusCode))
	    if (!body)
	      return cb(new Error('no body result'))

	    var binary = false 

	    //if the response type is an array buffer,
	    //we need to convert it into a regular Buffer object
	    if (isArrayBuffer(body)) {
	      var array = new Uint8Array(body)
	      body = new Buffer(array, 'binary')
	    }

	    //now check the string/Buffer response
	    //and see if it has a binary BMF header
	    if (isBinaryFormat(body)) {
	      binary = true
	      //if we have a string, turn it into a Buffer
	      if (typeof body === 'string') 
	        body = new Buffer(body, 'binary')
	    } 

	    //we are not parsing a binary format, just ASCII/XML/etc
	    if (!binary) {
	      //might still be a buffer if responseType is 'arraybuffer'
	      if (Buffer.isBuffer(body))
	        body = body.toString(opt.encoding)
	      body = body.trim()
	    }

	    var result
	    try {
	      var type = res.headers['content-type']
	      if (binary)
	        result = readBinary(body)
	      else if (/json/.test(type) || body.charAt(0) === '{')
	        result = JSON.parse(body)
	      else if (/xml/.test(type)  || body.charAt(0) === '<')
	        result = parseXML(body)
	      else
	        result = parseASCII(body)
	    } catch (e) {
	      cb(new Error('error parsing font '+e.message))
	      cb = noop
	    }
	    cb(null, result)
	  })
	}

	function isArrayBuffer(arr) {
	  var str = Object.prototype.toString
	  return str.call(arr) === '[object ArrayBuffer]'
	}

	function getBinaryOpts(opt) {
	  //IE10+ and other modern browsers support array buffers
	  if (xml2)
	    return xtend(opt, { responseType: 'arraybuffer' })
	  
	  if (typeof window.XMLHttpRequest === 'undefined')
	    throw new Error('your browser does not support XHR loading')

	  //IE9 and XML1 browsers could still use an override
	  var req = new window.XMLHttpRequest()
	  req.overrideMimeType('text/plain; charset=x-user-defined')
	  return xtend({
	    xhr: req
	  }, opt)
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(18).Buffer))

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */

	'use strict'

	var base64 = __webpack_require__(19)
	var ieee754 = __webpack_require__(20)
	var isArray = __webpack_require__(21)

	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50
	Buffer.poolSize = 8192 // not used by this implementation

	var rootParent = {}

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
	 *     on objects.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
	  ? global.TYPED_ARRAY_SUPPORT
	  : typedArraySupport()

	function typedArraySupport () {
	  function Bar () {}
	  try {
	    var arr = new Uint8Array(1)
	    arr.foo = function () { return 42 }
	    arr.constructor = Bar
	    return arr.foo() === 42 && // typed array instances can be augmented
	        arr.constructor === Bar && // constructor can be set
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	/**
	 * Class: Buffer
	 * =============
	 *
	 * The Buffer constructor returns instances of `Uint8Array` that are augmented
	 * with function properties for all the node `Buffer` API functions. We use
	 * `Uint8Array` so that square bracket notation works as expected -- it returns
	 * a single octet.
	 *
	 * By augmenting the instances, we can avoid modifying the `Uint8Array`
	 * prototype.
	 */
	function Buffer (arg) {
	  if (!(this instanceof Buffer)) {
	    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
	    if (arguments.length > 1) return new Buffer(arg, arguments[1])
	    return new Buffer(arg)
	  }

	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    this.length = 0
	    this.parent = undefined
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    return fromNumber(this, arg)
	  }

	  // Slightly less common case.
	  if (typeof arg === 'string') {
	    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
	  }

	  // Unusual.
	  return fromObject(this, arg)
	}

	function fromNumber (that, length) {
	  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < length; i++) {
	      that[i] = 0
	    }
	  }
	  return that
	}

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

	  // Assumption: byteLength() return value is always < kMaxLength.
	  var length = byteLength(string, encoding) | 0
	  that = allocate(that, length)

	  that.write(string, encoding)
	  return that
	}

	function fromObject (that, object) {
	  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

	  if (isArray(object)) return fromArray(that, object)

	  if (object == null) {
	    throw new TypeError('must start with number, buffer, array or string')
	  }

	  if (typeof ArrayBuffer !== 'undefined') {
	    if (object.buffer instanceof ArrayBuffer) {
	      return fromTypedArray(that, object)
	    }
	    if (object instanceof ArrayBuffer) {
	      return fromArrayBuffer(that, object)
	    }
	  }

	  if (object.length) return fromArrayLike(that, object)

	  return fromJsonObject(that, object)
	}

	function fromBuffer (that, buffer) {
	  var length = checked(buffer.length) | 0
	  that = allocate(that, length)
	  buffer.copy(that, 0, 0, length)
	  return that
	}

	function fromArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Duplicate of fromArray() to keep fromArray() monomorphic.
	function fromTypedArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  // Truncating the elements is probably not what people expect from typed
	  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
	  // of the old Buffer constructor.
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	function fromArrayBuffer (that, array) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    array.byteLength
	    that = Buffer._augment(new Uint8Array(array))
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromTypedArray(that, new Uint8Array(array))
	  }
	  return that
	}

	function fromArrayLike (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
	// Returns a zero-length buffer for inputs that don't conform to the spec.
	function fromJsonObject (that, object) {
	  var array
	  var length = 0

	  if (object.type === 'Buffer' && isArray(object.data)) {
	    array = object.data
	    length = checked(array.length) | 0
	  }
	  that = allocate(that, length)

	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype
	  Buffer.__proto__ = Uint8Array
	} else {
	  // pre-set for values that may exist in the future
	  Buffer.prototype.length = undefined
	  Buffer.prototype.parent = undefined
	}

	function allocate (that, length) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = Buffer._augment(new Uint8Array(length))
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that.length = length
	    that._isBuffer = true
	  }

	  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
	  if (fromPool) that.parent = rootParent

	  return that
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (subject, encoding) {
	  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

	  var buf = new Buffer(subject, encoding)
	  delete buf.parent
	  return buf
	}

	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length
	  var y = b.length

	  var i = 0
	  var len = Math.min(x, y)
	  while (i < len) {
	    if (a[i] !== b[i]) break

	    ++i
	  }

	  if (i !== len) {
	    x = a[i]
	    y = b[i]
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'binary':
	    case 'base64':
	    case 'raw':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

	  if (list.length === 0) {
	    return new Buffer(0)
	  }

	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; i++) {
	      length += list[i].length
	    }
	  }

	  var buf = new Buffer(length)
	  var pos = 0
	  for (i = 0; i < list.length; i++) {
	    var item = list[i]
	    item.copy(buf, pos)
	    pos += item.length
	  }
	  return buf
	}

	function byteLength (string, encoding) {
	  if (typeof string !== 'string') string = '' + string

	  var len = string.length
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'binary':
	      // Deprecated
	      case 'raw':
	      case 'raws':
	        return len
	      case 'utf8':
	      case 'utf-8':
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength

	function slowToString (encoding, start, end) {
	  var loweredCase = false

	  start = start | 0
	  end = end === undefined || end === Infinity ? this.length : end | 0

	  if (!encoding) encoding = 'utf8'
	  if (start < 0) start = 0
	  if (end > this.length) end = this.length
	  if (end <= start) return ''

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'binary':
	        return binarySlice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}

	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}

	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}

	Buffer.prototype.compare = function compare (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return 0
	  return Buffer.compare(this, b)
	}

	Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
	  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
	  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
	  byteOffset >>= 0

	  if (this.length === 0) return -1
	  if (byteOffset >= this.length) return -1

	  // Negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

	  if (typeof val === 'string') {
	    if (val.length === 0) return -1 // special case: looking for empty string always fails
	    return String.prototype.indexOf.call(this, val, byteOffset)
	  }
	  if (Buffer.isBuffer(val)) {
	    return arrayIndexOf(this, val, byteOffset)
	  }
	  if (typeof val === 'number') {
	    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
	      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
	    }
	    return arrayIndexOf(this, [ val ], byteOffset)
	  }

	  function arrayIndexOf (arr, val, byteOffset) {
	    var foundIndex = -1
	    for (var i = 0; byteOffset + i < arr.length; i++) {
	      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
	      } else {
	        foundIndex = -1
	      }
	    }
	    return -1
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	// `get` is deprecated
	Buffer.prototype.get = function get (offset) {
	  console.log('.get() is deprecated. Access using array indexes instead.')
	  return this.readUInt8(offset)
	}

	// `set` is deprecated
	Buffer.prototype.set = function set (v, offset) {
	  console.log('.set() is deprecated. Access using array indexes instead.')
	  return this.writeUInt8(v, offset)
	}

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; i++) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(parsed)) throw new Error('Invalid hex string')
	    buf[offset + i] = parsed
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function binaryWrite (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0
	    if (isFinite(length)) {
	      length = length | 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    var swap = encoding
	    encoding = offset
	    offset = length | 0
	    length = swap
	  }

	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8'

	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'binary':
	        return binaryWrite(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []

	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }

	    res.push(codePoint)
	    i += bytesPerSequence
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}

	function binarySlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length

	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len

	  var out = ''
	  for (var i = start; i < end; i++) {
	    out += toHex(buf[i])
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end

	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }

	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }

	  if (end < start) end = start

	  var newBuf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = Buffer._augment(this.subarray(start, end))
	  } else {
	    var sliceLen = end - start
	    newBuf = new Buffer(sliceLen, undefined)
	    for (var i = 0; i < sliceLen; i++) {
	      newBuf[i] = this[i + start]
	    }
	  }

	  if (newBuf.length) newBuf.parent = this.parent || this

	  return newBuf
	}

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }

	  return val
	}

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }

	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }

	  return val
	}

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = 0
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	  if (offset < 0) throw new RangeError('index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }

	  var len = end - start
	  var i

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; i--) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; i++) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    target._set(this.subarray(start, start + len), targetStart)
	  }

	  return len
	}

	// fill(value, start=0, end=buffer.length)
	Buffer.prototype.fill = function fill (value, start, end) {
	  if (!value) value = 0
	  if (!start) start = 0
	  if (!end) end = this.length

	  if (end < start) throw new RangeError('end < start')

	  // Fill 0 bytes; we're done
	  if (end === start) return
	  if (this.length === 0) return

	  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
	  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

	  var i
	  if (typeof value === 'number') {
	    for (i = start; i < end; i++) {
	      this[i] = value
	    }
	  } else {
	    var bytes = utf8ToBytes(value.toString())
	    var len = bytes.length
	    for (i = start; i < end; i++) {
	      this[i] = bytes[i % len]
	    }
	  }

	  return this
	}

	/**
	 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
	 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
	 */
	Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
	  if (typeof Uint8Array !== 'undefined') {
	    if (Buffer.TYPED_ARRAY_SUPPORT) {
	      return (new Buffer(this)).buffer
	    } else {
	      var buf = new Uint8Array(this.length)
	      for (var i = 0, len = buf.length; i < len; i += 1) {
	        buf[i] = this[i]
	      }
	      return buf.buffer
	    }
	  } else {
	    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
	  }
	}

	// HELPER FUNCTIONS
	// ================

	var BP = Buffer.prototype

	/**
	 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
	 */
	Buffer._augment = function _augment (arr) {
	  arr.constructor = Buffer
	  arr._isBuffer = true

	  // save reference to original Uint8Array set method before overwriting
	  arr._set = arr.set

	  // deprecated
	  arr.get = BP.get
	  arr.set = BP.set

	  arr.write = BP.write
	  arr.toString = BP.toString
	  arr.toLocaleString = BP.toString
	  arr.toJSON = BP.toJSON
	  arr.equals = BP.equals
	  arr.compare = BP.compare
	  arr.indexOf = BP.indexOf
	  arr.copy = BP.copy
	  arr.slice = BP.slice
	  arr.readUIntLE = BP.readUIntLE
	  arr.readUIntBE = BP.readUIntBE
	  arr.readUInt8 = BP.readUInt8
	  arr.readUInt16LE = BP.readUInt16LE
	  arr.readUInt16BE = BP.readUInt16BE
	  arr.readUInt32LE = BP.readUInt32LE
	  arr.readUInt32BE = BP.readUInt32BE
	  arr.readIntLE = BP.readIntLE
	  arr.readIntBE = BP.readIntBE
	  arr.readInt8 = BP.readInt8
	  arr.readInt16LE = BP.readInt16LE
	  arr.readInt16BE = BP.readInt16BE
	  arr.readInt32LE = BP.readInt32LE
	  arr.readInt32BE = BP.readInt32BE
	  arr.readFloatLE = BP.readFloatLE
	  arr.readFloatBE = BP.readFloatBE
	  arr.readDoubleLE = BP.readDoubleLE
	  arr.readDoubleBE = BP.readDoubleBE
	  arr.writeUInt8 = BP.writeUInt8
	  arr.writeUIntLE = BP.writeUIntLE
	  arr.writeUIntBE = BP.writeUIntBE
	  arr.writeUInt16LE = BP.writeUInt16LE
	  arr.writeUInt16BE = BP.writeUInt16BE
	  arr.writeUInt32LE = BP.writeUInt32LE
	  arr.writeUInt32BE = BP.writeUInt32BE
	  arr.writeIntLE = BP.writeIntLE
	  arr.writeIntBE = BP.writeIntBE
	  arr.writeInt8 = BP.writeInt8
	  arr.writeInt16LE = BP.writeInt16LE
	  arr.writeInt16BE = BP.writeInt16BE
	  arr.writeInt32LE = BP.writeInt32LE
	  arr.writeInt32BE = BP.writeInt32BE
	  arr.writeFloatLE = BP.writeFloatLE
	  arr.writeFloatBE = BP.writeFloatBE
	  arr.writeDoubleLE = BP.writeDoubleLE
	  arr.writeDoubleBE = BP.writeDoubleBE
	  arr.fill = BP.fill
	  arr.inspect = BP.inspect
	  arr.toArrayBuffer = BP.toArrayBuffer

	  return arr
	}

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []

	  for (var i = 0; i < length; i++) {
	    codePoint = string.charCodeAt(i)

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }

	    leadSurrogate = null

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; i++) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(18).Buffer, (function() { return this; }())))

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	;(function (exports) {
		'use strict';

	  var Arr = (typeof Uint8Array !== 'undefined')
	    ? Uint8Array
	    : Array

		var PLUS   = '+'.charCodeAt(0)
		var SLASH  = '/'.charCodeAt(0)
		var NUMBER = '0'.charCodeAt(0)
		var LOWER  = 'a'.charCodeAt(0)
		var UPPER  = 'A'.charCodeAt(0)
		var PLUS_URL_SAFE = '-'.charCodeAt(0)
		var SLASH_URL_SAFE = '_'.charCodeAt(0)

		function decode (elt) {
			var code = elt.charCodeAt(0)
			if (code === PLUS ||
			    code === PLUS_URL_SAFE)
				return 62 // '+'
			if (code === SLASH ||
			    code === SLASH_URL_SAFE)
				return 63 // '/'
			if (code < NUMBER)
				return -1 //no match
			if (code < NUMBER + 10)
				return code - NUMBER + 26 + 26
			if (code < UPPER + 26)
				return code - UPPER
			if (code < LOWER + 26)
				return code - LOWER + 26
		}

		function b64ToByteArray (b64) {
			var i, j, l, tmp, placeHolders, arr

			if (b64.length % 4 > 0) {
				throw new Error('Invalid string. Length must be a multiple of 4')
			}

			// the number of equal signs (place holders)
			// if there are two placeholders, than the two characters before it
			// represent one byte
			// if there is only one, then the three characters before it represent 2 bytes
			// this is just a cheap hack to not do indexOf twice
			var len = b64.length
			placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

			// base64 is 4/3 + up to two characters of the original data
			arr = new Arr(b64.length * 3 / 4 - placeHolders)

			// if there are placeholders, only get up to the last complete 4 chars
			l = placeHolders > 0 ? b64.length - 4 : b64.length

			var L = 0

			function push (v) {
				arr[L++] = v
			}

			for (i = 0, j = 0; i < l; i += 4, j += 3) {
				tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
				push((tmp & 0xFF0000) >> 16)
				push((tmp & 0xFF00) >> 8)
				push(tmp & 0xFF)
			}

			if (placeHolders === 2) {
				tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
				push(tmp & 0xFF)
			} else if (placeHolders === 1) {
				tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
				push((tmp >> 8) & 0xFF)
				push(tmp & 0xFF)
			}

			return arr
		}

		function uint8ToBase64 (uint8) {
			var i,
				extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
				output = "",
				temp, length

			function encode (num) {
				return lookup.charAt(num)
			}

			function tripletToBase64 (num) {
				return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
			}

			// go through the array every three bytes, we'll deal with trailing stuff later
			for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
				temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
				output += tripletToBase64(temp)
			}

			// pad the end with zeros, but make sure to not forget the extra bytes
			switch (extraBytes) {
				case 1:
					temp = uint8[uint8.length - 1]
					output += encode(temp >> 2)
					output += encode((temp << 4) & 0x3F)
					output += '=='
					break
				case 2:
					temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
					output += encode(temp >> 10)
					output += encode((temp >> 4) & 0x3F)
					output += encode((temp << 2) & 0x3F)
					output += '='
					break
			}

			return output
		}

		exports.toByteArray = b64ToByteArray
		exports.fromByteArray = uint8ToBase64
	}( false ? (this.base64js = {}) : exports))


/***/ },
/* 20 */
/***/ function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]

	  i += d

	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

	  value = Math.abs(value)

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }

	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 21 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var window = __webpack_require__(23)
	var once = __webpack_require__(24)
	var isFunction = __webpack_require__(25)
	var parseHeaders = __webpack_require__(26)
	var xtend = __webpack_require__(4)

	module.exports = createXHR
	createXHR.XMLHttpRequest = window.XMLHttpRequest || noop
	createXHR.XDomainRequest = "withCredentials" in (new createXHR.XMLHttpRequest()) ? createXHR.XMLHttpRequest : window.XDomainRequest

	forEachArray(["get", "put", "post", "patch", "head", "delete"], function(method) {
	    createXHR[method === "delete" ? "del" : method] = function(uri, options, callback) {
	        options = initParams(uri, options, callback)
	        options.method = method.toUpperCase()
	        return _createXHR(options)
	    }
	})

	function forEachArray(array, iterator) {
	    for (var i = 0; i < array.length; i++) {
	        iterator(array[i])
	    }
	}

	function isEmpty(obj){
	    for(var i in obj){
	        if(obj.hasOwnProperty(i)) return false
	    }
	    return true
	}

	function initParams(uri, options, callback) {
	    var params = uri

	    if (isFunction(options)) {
	        callback = options
	        if (typeof uri === "string") {
	            params = {uri:uri}
	        }
	    } else {
	        params = xtend(options, {uri: uri})
	    }

	    params.callback = callback
	    return params
	}

	function createXHR(uri, options, callback) {
	    options = initParams(uri, options, callback)
	    return _createXHR(options)
	}

	function _createXHR(options) {
	    var callback = options.callback
	    if(typeof callback === "undefined"){
	        throw new Error("callback argument missing")
	    }
	    callback = once(callback)

	    function readystatechange() {
	        if (xhr.readyState === 4) {
	            loadFunc()
	        }
	    }

	    function getBody() {
	        // Chrome with requestType=blob throws errors arround when even testing access to responseText
	        var body = undefined

	        if (xhr.response) {
	            body = xhr.response
	        } else if (xhr.responseType === "text" || !xhr.responseType) {
	            body = xhr.responseText || xhr.responseXML
	        }

	        if (isJson) {
	            try {
	                body = JSON.parse(body)
	            } catch (e) {}
	        }

	        return body
	    }

	    var failureResponse = {
	                body: undefined,
	                headers: {},
	                statusCode: 0,
	                method: method,
	                url: uri,
	                rawRequest: xhr
	            }

	    function errorFunc(evt) {
	        clearTimeout(timeoutTimer)
	        if(!(evt instanceof Error)){
	            evt = new Error("" + (evt || "Unknown XMLHttpRequest Error") )
	        }
	        evt.statusCode = 0
	        callback(evt, failureResponse)
	    }

	    // will load the data & process the response in a special response object
	    function loadFunc() {
	        if (aborted) return
	        var status
	        clearTimeout(timeoutTimer)
	        if(options.useXDR && xhr.status===undefined) {
	            //IE8 CORS GET successful response doesn't have a status field, but body is fine
	            status = 200
	        } else {
	            status = (xhr.status === 1223 ? 204 : xhr.status)
	        }
	        var response = failureResponse
	        var err = null

	        if (status !== 0){
	            response = {
	                body: getBody(),
	                statusCode: status,
	                method: method,
	                headers: {},
	                url: uri,
	                rawRequest: xhr
	            }
	            if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
	                response.headers = parseHeaders(xhr.getAllResponseHeaders())
	            }
	        } else {
	            err = new Error("Internal XMLHttpRequest Error")
	        }
	        callback(err, response, response.body)

	    }

	    var xhr = options.xhr || null

	    if (!xhr) {
	        if (options.cors || options.useXDR) {
	            xhr = new createXHR.XDomainRequest()
	        }else{
	            xhr = new createXHR.XMLHttpRequest()
	        }
	    }

	    var key
	    var aborted
	    var uri = xhr.url = options.uri || options.url
	    var method = xhr.method = options.method || "GET"
	    var body = options.body || options.data || null
	    var headers = xhr.headers = options.headers || {}
	    var sync = !!options.sync
	    var isJson = false
	    var timeoutTimer

	    if ("json" in options) {
	        isJson = true
	        headers["accept"] || headers["Accept"] || (headers["Accept"] = "application/json") //Don't override existing accept header declared by user
	        if (method !== "GET" && method !== "HEAD") {
	            headers["content-type"] || headers["Content-Type"] || (headers["Content-Type"] = "application/json") //Don't override existing accept header declared by user
	            body = JSON.stringify(options.json)
	        }
	    }

	    xhr.onreadystatechange = readystatechange
	    xhr.onload = loadFunc
	    xhr.onerror = errorFunc
	    // IE9 must have onprogress be set to a unique function.
	    xhr.onprogress = function () {
	        // IE must die
	    }
	    xhr.ontimeout = errorFunc
	    xhr.open(method, uri, !sync, options.username, options.password)
	    //has to be after open
	    if(!sync) {
	        xhr.withCredentials = !!options.withCredentials
	    }
	    // Cannot set timeout with sync request
	    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
	    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent
	    if (!sync && options.timeout > 0 ) {
	        timeoutTimer = setTimeout(function(){
	            aborted=true//IE9 may still call readystatechange
	            xhr.abort("timeout")
	            var e = new Error("XMLHttpRequest timeout")
	            e.code = "ETIMEDOUT"
	            errorFunc(e)
	        }, options.timeout )
	    }

	    if (xhr.setRequestHeader) {
	        for(key in headers){
	            if(headers.hasOwnProperty(key)){
	                xhr.setRequestHeader(key, headers[key])
	            }
	        }
	    } else if (options.headers && !isEmpty(options.headers)) {
	        throw new Error("Headers cannot be set on an XDomainRequest object")
	    }

	    if ("responseType" in options) {
	        xhr.responseType = options.responseType
	    }

	    if ("beforeSend" in options &&
	        typeof options.beforeSend === "function"
	    ) {
	        options.beforeSend(xhr)
	    }

	    xhr.send(body)

	    return xhr


	}

	function noop() {}


/***/ },
/* 23 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {if (typeof window !== "undefined") {
	    module.exports = window;
	} else if (typeof global !== "undefined") {
	    module.exports = global;
	} else if (typeof self !== "undefined"){
	    module.exports = self;
	} else {
	    module.exports = {};
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 24 */
/***/ function(module, exports) {

	module.exports = once

	once.proto = once(function () {
	  Object.defineProperty(Function.prototype, 'once', {
	    value: function () {
	      return once(this)
	    },
	    configurable: true
	  })
	})

	function once (fn) {
	  var called = false
	  return function () {
	    if (called) return
	    called = true
	    return fn.apply(this, arguments)
	  }
	}


/***/ },
/* 25 */
/***/ function(module, exports) {

	module.exports = isFunction

	var toString = Object.prototype.toString

	function isFunction (fn) {
	  var string = toString.call(fn)
	  return string === '[object Function]' ||
	    (typeof fn === 'function' && string !== '[object RegExp]') ||
	    (typeof window !== 'undefined' &&
	     // IE8 and below
	     (fn === window.setTimeout ||
	      fn === window.alert ||
	      fn === window.confirm ||
	      fn === window.prompt))
	};


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var trim = __webpack_require__(27)
	  , forEach = __webpack_require__(28)
	  , isArray = function(arg) {
	      return Object.prototype.toString.call(arg) === '[object Array]';
	    }

	module.exports = function (headers) {
	  if (!headers)
	    return {}

	  var result = {}

	  forEach(
	      trim(headers).split('\n')
	    , function (row) {
	        var index = row.indexOf(':')
	          , key = trim(row.slice(0, index)).toLowerCase()
	          , value = trim(row.slice(index + 1))

	        if (typeof(result[key]) === 'undefined') {
	          result[key] = value
	        } else if (isArray(result[key])) {
	          result[key].push(value)
	        } else {
	          result[key] = [ result[key], value ]
	        }
	      }
	  )

	  return result
	}

/***/ },
/* 27 */
/***/ function(module, exports) {

	
	exports = module.exports = trim;

	function trim(str){
	  return str.replace(/^\s*|\s*$/g, '');
	}

	exports.left = function(str){
	  return str.replace(/^\s*/, '');
	};

	exports.right = function(str){
	  return str.replace(/\s*$/, '');
	};


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var isFunction = __webpack_require__(25)

	module.exports = forEach

	var toString = Object.prototype.toString
	var hasOwnProperty = Object.prototype.hasOwnProperty

	function forEach(list, iterator, context) {
	    if (!isFunction(iterator)) {
	        throw new TypeError('iterator must be a function')
	    }

	    if (arguments.length < 3) {
	        context = this
	    }
	    
	    if (toString.call(list) === '[object Array]')
	        forEachArray(list, iterator, context)
	    else if (typeof list === 'string')
	        forEachString(list, iterator, context)
	    else
	        forEachObject(list, iterator, context)
	}

	function forEachArray(array, iterator, context) {
	    for (var i = 0, len = array.length; i < len; i++) {
	        if (hasOwnProperty.call(array, i)) {
	            iterator.call(context, array[i], i, array)
	        }
	    }
	}

	function forEachString(string, iterator, context) {
	    for (var i = 0, len = string.length; i < len; i++) {
	        // no such thing as a sparse string.
	        iterator.call(context, string.charAt(i), i, string)
	    }
	}

	function forEachObject(object, iterator, context) {
	    for (var k in object) {
	        if (hasOwnProperty.call(object, k)) {
	            iterator.call(context, object[k], k, object)
	        }
	    }
	}


/***/ },
/* 29 */
/***/ function(module, exports) {

	module.exports = function parseBMFontAscii(data) {
	  if (!data)
	    throw new Error('no data provided')
	  data = data.toString().trim()

	  var output = {
	    pages: [],
	    chars: [],
	    kernings: []
	  }

	  var lines = data.split(/\r\n?|\n/g)

	  if (lines.length === 0)
	    throw new Error('no data in BMFont file')

	  for (var i = 0; i < lines.length; i++) {
	    var lineData = splitLine(lines[i], i)
	    if (!lineData) //skip empty lines
	      continue

	    if (lineData.key === 'page') {
	      if (typeof lineData.data.id !== 'number')
	        throw new Error('malformed file at line ' + i + ' -- needs page id=N')
	      if (typeof lineData.data.file !== 'string')
	        throw new Error('malformed file at line ' + i + ' -- needs page file="path"')
	      output.pages[lineData.data.id] = lineData.data.file
	    } else if (lineData.key === 'chars' || lineData.key === 'kernings') {
	      //... do nothing for these two ...
	    } else if (lineData.key === 'char') {
	      output.chars.push(lineData.data)
	    } else if (lineData.key === 'kerning') {
	      output.kernings.push(lineData.data)
	    } else {
	      output[lineData.key] = lineData.data
	    }
	  }

	  return output
	}

	function splitLine(line, idx) {
	  line = line.replace(/\t+/g, ' ').trim()
	  if (!line)
	    return null

	  var space = line.indexOf(' ')
	  if (space === -1) 
	    throw new Error("no named row at line " + idx)

	  var key = line.substring(0, space)

	  line = line.substring(space + 1)
	  //clear "letter" field as it is non-standard and
	  //requires additional complexity to parse " / = symbols
	  line = line.replace(/letter=[\'\"]\S+[\'\"]/gi, '')  
	  line = line.split("=")
	  line = line.map(function(str) {
	    return str.trim().match((/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g))
	  })

	  var data = []
	  for (var i = 0; i < line.length; i++) {
	    var dt = line[i]
	    if (i === 0) {
	      data.push({
	        key: dt[0],
	        data: ""
	      })
	    } else if (i === line.length - 1) {
	      data[data.length - 1].data = parseData(dt[0])
	    } else {
	      data[data.length - 1].data = parseData(dt[0])
	      data.push({
	        key: dt[1],
	        data: ""
	      })
	    }
	  }

	  var out = {
	    key: key,
	    data: {}
	  }

	  data.forEach(function(v) {
	    out.data[v.key] = v.data;
	  })

	  return out
	}

	function parseData(data) {
	  if (!data || data.length === 0)
	    return ""

	  if (data.indexOf('"') === 0 || data.indexOf("'") === 0)
	    return data.substring(1, data.length - 1)
	  if (data.indexOf(',') !== -1)
	    return parseIntList(data)
	  return parseInt(data, 10)
	}

	function parseIntList(data) {
	  return data.split(',').map(function(val) {
	    return parseInt(val, 10)
	  })
	}

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var parseAttributes = __webpack_require__(31)
	var parseFromString = __webpack_require__(32)

	//In some cases element.attribute.nodeName can return
	//all lowercase values.. so we need to map them to the correct 
	//case
	var NAME_MAP = {
	  scaleh: 'scaleH',
	  scalew: 'scaleW',
	  stretchh: 'stretchH',
	  lineheight: 'lineHeight',
	  alphachnl: 'alphaChnl',
	  redchnl: 'redChnl',
	  greenchnl: 'greenChnl',
	  bluechnl: 'blueChnl'
	}

	module.exports = function parse(data) {
	  data = data.toString()
	  
	  var xmlRoot = parseFromString(data)
	  var output = {
	    pages: [],
	    chars: [],
	    kernings: []
	  }

	  //get config settings
	  ;['info', 'common'].forEach(function(key) {
	    var element = xmlRoot.getElementsByTagName(key)[0]
	    if (element)
	      output[key] = parseAttributes(getAttribs(element))
	  })

	  //get page info
	  var pageRoot = xmlRoot.getElementsByTagName('pages')[0]
	  if (!pageRoot)
	    throw new Error('malformed file -- no <pages> element')
	  var pages = pageRoot.getElementsByTagName('page')
	  for (var i=0; i<pages.length; i++) {
	    var p = pages[i]
	    var id = parseInt(p.getAttribute('id'), 10)
	    var file = p.getAttribute('file')
	    if (isNaN(id))
	      throw new Error('malformed file -- page "id" attribute is NaN')
	    if (!file)
	      throw new Error('malformed file -- needs page "file" attribute')
	    output.pages[parseInt(id, 10)] = file
	  }

	  //get kernings / chars
	  ;['chars', 'kernings'].forEach(function(key) {
	    var element = xmlRoot.getElementsByTagName(key)[0]
	    if (!element)
	      return
	    var childTag = key.substring(0, key.length-1)
	    var children = element.getElementsByTagName(childTag)
	    for (var i=0; i<children.length; i++) {      
	      var child = children[i]
	      output[key].push(parseAttributes(getAttribs(child)))
	    }
	  })
	  return output
	}

	function getAttribs(element) {
	  var attribs = getAttribList(element)
	  return attribs.reduce(function(dict, attrib) {
	    var key = mapName(attrib.nodeName)
	    dict[key] = attrib.nodeValue
	    return dict
	  }, {})
	}

	function getAttribList(element) {
	  //IE8+ and modern browsers
	  var attribs = []
	  for (var i=0; i<element.attributes.length; i++)
	    attribs.push(element.attributes[i])
	  return attribs
	}

	function mapName(nodeName) {
	  return NAME_MAP[nodeName.toLowerCase()] || nodeName
	}

/***/ },
/* 31 */
/***/ function(module, exports) {

	//Some versions of GlyphDesigner have a typo
	//that causes some bugs with parsing. 
	//Need to confirm with recent version of the software
	//to see whether this is still an issue or not.
	var GLYPH_DESIGNER_ERROR = 'chasrset'

	module.exports = function parseAttributes(obj) {
	  if (GLYPH_DESIGNER_ERROR in obj) {
	    obj['charset'] = obj[GLYPH_DESIGNER_ERROR]
	    delete obj[GLYPH_DESIGNER_ERROR]
	  }

	  for (var k in obj) {
	    if (k === 'face' || k === 'charset') 
	      continue
	    else if (k === 'padding' || k === 'spacing')
	      obj[k] = parseIntList(obj[k])
	    else
	      obj[k] = parseInt(obj[k], 10) 
	  }
	  return obj
	}

	function parseIntList(data) {
	  return data.split(',').map(function(val) {
	    return parseInt(val, 10)
	  })
	}

/***/ },
/* 32 */
/***/ function(module, exports) {

	module.exports = (function xmlparser() {
	  //common browsers
	  if (typeof window.DOMParser !== 'undefined') {
	    return function(str) {
	      var parser = new window.DOMParser()
	      return parser.parseFromString(str, 'application/xml')
	    }
	  } 

	  //IE8 fallback
	  if (typeof window.ActiveXObject !== 'undefined'
	      && new window.ActiveXObject('Microsoft.XMLDOM')) {
	    return function(str) {
	      var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM")
	      xmlDoc.async = "false"
	      xmlDoc.loadXML(str)
	      return xmlDoc
	    }
	  }

	  //last resort fallback
	  return function(str) {
	    var div = document.createElement('div')
	    div.innerHTML = str
	    return div
	  }
	})()

/***/ },
/* 33 */
/***/ function(module, exports) {

	var HEADER = [66, 77, 70]

	module.exports = function readBMFontBinary(buf) {
	  if (buf.length < 6)
	    throw new Error('invalid buffer length for BMFont')

	  var header = HEADER.every(function(byte, i) {
	    return buf.readUInt8(i) === byte
	  })

	  if (!header)
	    throw new Error('BMFont missing BMF byte header')

	  var i = 3
	  var vers = buf.readUInt8(i++)
	  if (vers > 3)
	    throw new Error('Only supports BMFont Binary v3 (BMFont App v1.10)')
	  
	  var target = { kernings: [], chars: [] }
	  for (var b=0; b<5; b++)
	    i += readBlock(target, buf, i)
	  return target
	}

	function readBlock(target, buf, i) {
	  if (i > buf.length-1)
	    return 0

	  var blockID = buf.readUInt8(i++)
	  var blockSize = buf.readInt32LE(i)
	  i += 4

	  switch(blockID) {
	    case 1: 
	      target.info = readInfo(buf, i)
	      break
	    case 2:
	      target.common = readCommon(buf, i)
	      break
	    case 3:
	      target.pages = readPages(buf, i, blockSize)
	      break
	    case 4:
	      target.chars = readChars(buf, i, blockSize)
	      break
	    case 5:
	      target.kernings = readKernings(buf, i, blockSize)
	      break
	  }
	  return 5 + blockSize
	}

	function readInfo(buf, i) {
	  var info = {}
	  info.size = buf.readInt16LE(i)

	  var bitField = buf.readUInt8(i+2)
	  info.smooth = (bitField >> 7) & 1
	  info.unicode = (bitField >> 6) & 1
	  info.italic = (bitField >> 5) & 1
	  info.bold = (bitField >> 4) & 1
	  
	  //fixedHeight is only mentioned in binary spec 
	  if ((bitField >> 3) & 1)
	    info.fixedHeight = 1
	  
	  info.charset = buf.readUInt8(i+3) || ''
	  info.stretchH = buf.readUInt16LE(i+4)
	  info.aa = buf.readUInt8(i+6)
	  info.padding = [
	    buf.readInt8(i+7),
	    buf.readInt8(i+8),
	    buf.readInt8(i+9),
	    buf.readInt8(i+10)
	  ]
	  info.spacing = [
	    buf.readInt8(i+11),
	    buf.readInt8(i+12)
	  ]
	  info.outline = buf.readUInt8(i+13)
	  info.face = readStringNT(buf, i+14)
	  return info
	}

	function readCommon(buf, i) {
	  var common = {}
	  common.lineHeight = buf.readUInt16LE(i)
	  common.base = buf.readUInt16LE(i+2)
	  common.scaleW = buf.readUInt16LE(i+4)
	  common.scaleH = buf.readUInt16LE(i+6)
	  common.pages = buf.readUInt16LE(i+8)
	  var bitField = buf.readUInt8(i+10)
	  common.packed = 0
	  common.alphaChnl = buf.readUInt8(i+11)
	  common.redChnl = buf.readUInt8(i+12)
	  common.greenChnl = buf.readUInt8(i+13)
	  common.blueChnl = buf.readUInt8(i+14)
	  return common
	}

	function readPages(buf, i, size) {
	  var pages = []
	  var text = readNameNT(buf, i)
	  var len = text.length+1
	  var count = size / len
	  for (var c=0; c<count; c++) {
	    pages[c] = buf.slice(i, i+text.length).toString('utf8')
	    i += len
	  }
	  return pages
	}

	function readChars(buf, i, blockSize) {
	  var chars = []

	  var count = blockSize / 20
	  for (var c=0; c<count; c++) {
	    var char = {}
	    var off = c*20
	    char.id = buf.readUInt32LE(i + 0 + off)
	    char.x = buf.readUInt16LE(i + 4 + off)
	    char.y = buf.readUInt16LE(i + 6 + off)
	    char.width = buf.readUInt16LE(i + 8 + off)
	    char.height = buf.readUInt16LE(i + 10 + off)
	    char.xoffset = buf.readInt16LE(i + 12 + off)
	    char.yoffset = buf.readInt16LE(i + 14 + off)
	    char.xadvance = buf.readInt16LE(i + 16 + off)
	    char.page = buf.readUInt8(i + 18 + off)
	    char.chnl = buf.readUInt8(i + 19 + off)
	    chars[c] = char
	  }
	  return chars
	}

	function readKernings(buf, i, blockSize) {
	  var kernings = []
	  var count = blockSize / 10
	  for (var c=0; c<count; c++) {
	    var kern = {}
	    var off = c*10
	    kern.first = buf.readUInt32LE(i + 0 + off)
	    kern.second = buf.readUInt32LE(i + 4 + off)
	    kern.amount = buf.readInt16LE(i + 8 + off)
	    kernings[c] = kern
	  }
	  return kernings
	}

	function readNameNT(buf, offset) {
	  var pos=offset
	  for (; pos<buf.length; pos++) {
	    if (buf[pos] === 0x00) 
	      break
	  }
	  return buf.slice(offset, pos)
	}

	function readStringNT(buf, offset) {
	  return readNameNT(buf, offset).toString('utf8')
	}

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {var equal = __webpack_require__(35)
	var HEADER = new Buffer([66, 77, 70, 3])

	module.exports = function(buf) {
	  if (typeof buf === 'string')
	    return buf.substring(0, 3) === 'BMF'
	  return buf.length > 4 && equal(buf.slice(0, 4), HEADER)
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(18).Buffer))

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var Buffer = __webpack_require__(18).Buffer; // for use with browserify

	module.exports = function (a, b) {
	    if (!Buffer.isBuffer(a)) return undefined;
	    if (!Buffer.isBuffer(b)) return undefined;
	    if (typeof a.equals === 'function') return a.equals(b);
	    if (a.length !== b.length) return false;
	    
	    for (var i = 0; i < a.length; i++) {
	        if (a[i] !== b[i]) return false;
	    }
	    
	    return true;
	};


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	var assign = __webpack_require__(14)

	module.exports = function createSDFShader (opt) {
	  opt = opt || {}
	  var opacity = typeof opt.opacity === 'number' ? opt.opacity : 1
	  var alphaTest = typeof opt.alphaTest === 'number' ? opt.alphaTest : 0.0001
	  var precision = opt.precision || 'highp'
	  var color = opt.color
	  var map = opt.map

	  // remove to satisfy r73
	  delete opt.map
	  delete opt.color
	  delete opt.precision
	  delete opt.opacity

	  return assign({
	    uniforms: {
	      opacity: { type: 'f', value: opacity },
	      map: { type: 't', value: map || new THREE.Texture() },
	      color: { type: 'c', value: new THREE.Color(color) }
	    },
	    vertexShader: [
	      'attribute vec2 uv;',
	      'attribute vec4 position;',
	      'uniform mat4 projectionMatrix;',
	      'uniform mat4 modelViewMatrix;',
	      'varying vec2 vUv;',
	      'void main() {',
	      'vUv = uv;',
	      'gl_Position = projectionMatrix * modelViewMatrix * position;',
	      '}'
	    ].join('\n'),
	    fragmentShader: [
	      '#ifdef GL_OES_standard_derivatives',
	      '#extension GL_OES_standard_derivatives : enable',
	      '#endif',
	      'precision ' + precision + ' float;',
	      'uniform float opacity;',
	      'uniform vec3 color;',
	      'uniform sampler2D map;',
	      'varying vec2 vUv;',

	      'float aastep(float value) {',
	      '  #ifdef GL_OES_standard_derivatives',
	      '    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;',
	      '  #else',
	      '    float afwidth = (1.0 / 32.0) * (1.4142135623730951 / (2.0 * gl_FragCoord.w));',
	      '  #endif',
	      '  return smoothstep(0.5 - afwidth, 0.5 + afwidth, value);',
	      '}',

	      'void main() {',
	      '  vec4 texColor = texture2D(map, vUv);',
	      '  float alpha = aastep(texColor.a);',
	      '  gl_FragColor = vec4(color, opacity * alpha);',
	      alphaTest === 0
	        ? ''
	        : '  if (gl_FragColor.a < ' + alphaTest + ') discard;',
	      '}'
	    ].join('\n')
	  }, opt)
	}


/***/ }
/******/ ]);