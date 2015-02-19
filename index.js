var app = {}

app.TOP = 0
app.RIGHT = 1
app.BOTTOM = 2
app.LEFT = 3

app.GRID_SIZE     = 20 // px
app.GRID_WIDTH    = 5  // num
app.GRID_HEIGHT   = 15 // num
app.GRID_CELLS    = app.GRID_WIDTH * app.GRID_HEIGHT
app.CANVAS_WIDTH  = 720 // px  
app.CANVAS_HEIGHT = 402 // px  
app.grid         = new Array(app.GRID_HEIGHT * app.GRID_WIDTH)
_.fill(app.grid, false)
app.block        = _.map([3], function(n){return n+app.GRID_CELLS})
app.lastKeyPressed = 0
app.blockDownFrame =30 
app.blockDownCount = 0  

app.OFFSET_TOP    = app.GRID_WIDTH
app.OFFSET_RIGHT  = 1
app.OFFSET_BOTTOM = -(app.GRID_WIDTH)
app.OFFSET_LEFT   = -(1)

var hasReachedWall = function(edge) {
  var posEdge
  var offset
  var POS_TOP = app.GRID_HEIGHT - 1
  var POS_RIGHT = app.GRID_WIDTH - 1
  var POS_BOTTOM = 0
  var POS_LEFT = 0

  switch(edge) {
    case app.TOP:
      offset = app.OFFSET_TOP
      posEdge = POS_TOP
      break
    case app.RIGHT:
      offset = app.OFFSET_RIGHT
      posEdge = POS_RIGHT
      break
    case app.BOTTOM:
      offset = app.OFFSET_BOTTOM
      posEdge = POS_BOTTOM
      break
    case app.LEFT:
      offset = app.OFFSET_LEFT
      posEdge = POS_LEFT
      break
    default:
      console.log("hasReachedWall() invalid argument")
      break
  }

  var fn
  if ( edge === app.LEFT || edge === app.RIGHT ) {
    fn = function(n){
      var w = n % app.GRID_WIDTH
      return w === posEdge || app.grid[n + offset]
    }
  } else if ( edge === app.TOP || edge === app.BOTTOM ) {
    fn = function(n){
      var h = Math.floor(n / app.GRID_WIDTH)
      return h === posEdge || app.grid[n + offset]
    }
  } else {
    console.log("hasReachedWall() invalid argument")
  }

  return fn;
}

var moveBlockTo = function(block, direction) {
  var offset
  switch(direction) {
    case app.TOP:
      offset = app.OFFSET_TOP
      break
    case app.RIGHT:
      offset = app.OFFSET_RIGHT
      break
    case app.BOTTOM:
      offset = app.OFFSET_BOTTOM
      break
    case app.LEFT:
      offset = app.OFFSET_LEFT
      break
    default:
      console.log("moveBlockTo() invalid argument")
      break
  }

  var len = block.length
  for(var i = 0; i < len; i++) {
    // get position
    var tmp = block[i]
    block[i] = tmp + offset
  }
}

// TODO: controll key custumize setting 1
var mapKeyCodeToEdge = function (sketch, keyCode) {
  switch(keyCode) {
    case sketch.UP_ARROW:
      edge = app.TOP 
      break
    case sketch.RIGHT_ARROW:
      edge = app.RIGHT
      break
    case sketch.DOWN_ARROW:
      edge = app.BOTTOM
      break
    case sketch.LEFT_ARROW:
      edge = app.LEFT
      break
    default:
      console.log("moveBlockIfKeyPressed() invalid argument")
      break
  }
  return edge;
}

var moveBlockIfKeyPressed = function (sketch, keyCode) {
  if ( app.lastKeyPressed === keyCode) {
    var e = mapKeyCodeToEdge(sketch, keyCode)
    if ( !_.some(app.block, hasReachedWall(e)) ) {
      moveBlockTo(app.block, e)
    }
    // reset 
    app.lastKeyPressed = 0
  }
}

app.sketchHandle = function(sketch) {
  sketch.setup = function() {
    sketch.frameRate(30)
    sketch.createCanvas(app.CANVAS_WIDTH, app.CANVAS_HEIGHT)
  }

  // enable key setting
  // TODO: controll key custumize setting 2
  sketch.keyPressed = function() {
    switch(sketch.keyCode) {
      //case sketch.UP_ARROW: // for debug
      case sketch.RIGHT_ARROW:
      case sketch.DOWN_ARROW:
      case sketch.LEFT_ARROW:
        app.lastKeyPressed = sketch.keyCode
        break
      default:
        break
    }
    return false;
  }

  sketch.draw = function() {

    // erase canvas
    sketch.clear()

    // TODO: controll key custumize setting 3
    //moveBlockIfKeyPressed(sketch, sketch.UP_ARROW) // for debug
    moveBlockIfKeyPressed(sketch, sketch.LEFT_ARROW)
    moveBlockIfKeyPressed(sketch, sketch.RIGHT_ARROW)
    moveBlockIfKeyPressed(sketch, sketch.DOWN_ARROW)

    if ( app.blockDownCount == 0 ) {
      if ( _.some(app.block, hasReachedWall(app.BOTTOM)) ) {
        app.block.forEach(function(n) {
          app.grid[n] = true
        })
        // next block will appear
        app.block = _.map([3], function(n){return n+app.GRID_CELLS})
      }
      // move block down
      else {
        moveBlockTo(app.block, app.BOTTOM)
      }
    }

    app.block.forEach(function(e,idx,arr){
        // get position
        var w = e % app.GRID_WIDTH
        var h = Math.floor(e / app.GRID_WIDTH)

        // draw block controlled 
        sketch.stroke(0)
        sketch.rect(w * app.GRID_SIZE, (app.GRID_HEIGHT-h) * app.GRID_SIZE, app.GRID_SIZE, app.GRID_SIZE)
    },this)

    app.grid.forEach(function(e,idx,arr){
      if (e) {
        // get position
        var w = idx % app.GRID_WIDTH
        var h = Math.floor(idx / app.GRID_WIDTH)

        // draw rest blocks
        sketch.stroke(0)
        sketch.rect(w * app.GRID_SIZE, (app.GRID_HEIGHT-h) * app.GRID_SIZE, app.GRID_SIZE, app.GRID_SIZE)
      }
    },this)

    app.blockDownCount += 1
    if ( app.blockDownCount == app.blockDownFrame ) {
      app.blockDownCount = 0
    }
  }
}

var myp5 = new p5(app.sketchHandle)

