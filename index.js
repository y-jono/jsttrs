var app = {}

app.TOP    = 0
app.RIGHT  = 1
app.BOTTOM = 2
app.LEFT   = 3
app.GRID_SIZE     = 20 // px
app.GRID_WIDTH    = 10 // num
app.GRID_HEIGHT   = 15 // num
app.GRID_CELLS    = app.GRID_WIDTH * app.GRID_HEIGHT
app.CANVAS_WIDTH  = 720 // px  
app.CANVAS_HEIGHT = 402 // px  
app.BLOCK_DOWN_FRAME_INTERVAL = 30 
app.OFFSET_TOP    = app.GRID_WIDTH
app.OFFSET_RIGHT  = 1
app.OFFSET_BOTTOM = -(app.GRID_WIDTH)
app.OFFSET_LEFT   = -(1)
app.INIT_POS      = Math.floor(app.GRID_WIDTH / 2) - app.GRID_WIDTH
app.FRAME_RATE    = 60

app.TETRIMINO_I = [1, 0, 2, 3]
app.TETRIMINO_O = [0, 1, app.GRID_WIDTH, app.GRID_WIDTH+1]
app.TETRIMINO_T = [1, 0, 2, app.GRID_WIDTH+1]
app.TETRIMINO_J = [1, 0, 2, app.GRID_WIDTH]
app.TETRIMINO_L = [1, 0, 2, app.GRID_WIDTH+2]
app.TETRIMINO_S = [1, 0, app.GRID_WIDTH+1, app.GRID_WIDTH+2]
app.TETRIMINO_Z = [1, 2, app.GRID_WIDTH, app.GRID_WIDTH+1]

app.TETRIMINO = [
  app.TETRIMINO_I
  ,app.TETRIMINO_O
  ,app.TETRIMINO_T
  ,app.TETRIMINO_J
  ,app.TETRIMINO_L
  ,app.TETRIMINO_S
  ,app.TETRIMINO_Z
]

app.grid = new Array(app.GRID_HEIGHT * app.GRID_WIDTH)
_.fill(app.grid, false)

app.block = 
  _.map(
      app.TETRIMINO[_.random(0,app.TETRIMINO.length-1)],
      function(n){return n+app.GRID_CELLS})
app.rotateKeyPressed = 0
app.lastKeyPressed   = 0

var idx2Y = function(idx) {
  if ( idx >= 0 ) {
    return Math.floor(idx / app.GRID_WIDTH)
  } else {
    return Math.ceil(idx / app.GRID_WIDTH)
  }
}

var idx2X = function(idx) {
  return idx % app.GRID_WIDTH
}

var idx2Coord = function(idx) {
  return [idx2X(idx), idx2Y(idx)]
}

var coord2Idx = function(coord) {
  return coord[0] + (coord[1] * app.GRID_WIDTH)
}

var rotate0 = function(corrd) {
  return coord
}

var rotate90 = function(coord) {
  var x = -coord[1]
  var y = coord[0]
  return [x,y]
}

var rotate180 = function(coord) {
  var x = -coord[0]
  var y = -coord[1]
  return [x,y]
}

var rotate270 = function(coord) {
  var x = coord[1]
  var y = -coord[0]
  return [x,y]
}

var rotateX = function(x) {
  var fn
  switch(x) {
    case 1:
      fn = rotate270
      break
    case 2:
      fn = rotate180
      break
    case 3:
      fn = rotate90
      break
    case 0:
    default:
      fn = rotate0
      break
  }

  return fn
}

var rotateBlock = function(block, rotateCount) {
  if ( block.length <= 1 ) { return block }

  var fst = block[0]

  // rotate block
  var rotateeCoords = 
    _.chain(block)
      .rest()
      .map( _.flow(
            idx2Coord
            ,function(c){ return [ c[0]-idx2Coord(fst)[0], c[1]-idx2Coord(fst)[1] ] }
            ,rotateX(rotateCount)
            ,function(c){ return [ c[0]+idx2Coord(fst)[0], c[1]+idx2Coord(fst)[1] ] }
            )
          )
      .value()
  var tmp = _.map(rotateeCoords, coord2Idx)
  var rotated = [fst].concat(tmp)
  
  // validate rotated block stick out
  var leftCoord = _.min(rotateeCoords, function(c){return c[0]})
  if ( leftCoord[0] < 0 ) {
    rotated = block
  }
  var rightCoord = _.max(rotateeCoords, function(c){return c[0]})
  if ( rightCoord[0] >= app.GRID_WIDTH  ) {
    rotated = block
  }
  var downCoord = _.min(rotateeCoords, function(c){return c[1]})
  if ( downCoord[1] < 0) {
    rotated = block
  }

  // validate overlap between the block controlled and the block stacked
  var blockOverlapped = _.map(rotated, function(idx){ return app.grid[idx] })
  if(_.some(blockOverlapped)) {
    rotated = block
  }

  return rotated
}

var hasReachedWall = function(edge) {
  var posEdge
  ,offset
  ,fn
  var POS_TOP = app.GRID_HEIGHT - 1
  ,POS_RIGHT  = app.GRID_WIDTH - 1
  ,POS_BOTTOM = 0
  ,POS_LEFT   = 0

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

  if ( edge === app.LEFT || edge === app.RIGHT ) {
    fn = function(n){
      x = idx2X(n)
      return x === posEdge || app.grid[n + offset]
    }
  } else if ( edge === app.TOP || edge === app.BOTTOM ) {
    fn = function(n){
      y = idx2Y(n)
      return y === posEdge || app.grid[n + offset]
    }
  } else {
    console.log("hasReachedWall() invalid argument")
  }

  return fn;
}

var moveBlockTo = function(block, direction) {
  var offset
    ,len
    ,tmp
    ,i

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

  len = block.length
  for(i = 0; i < len; i++) {
    // get position
    tmp = block[i]
    block[i] = tmp + offset
  }
}

// TODO: controll key custumize setting 1
var mapKeyCodeToEdge = function (sketch, keyCode) {
  var edge
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
      console.log("mapKeyCodeToEdge() invalid argument")
      break
  }
  return edge;
}

app.rotateBlockIfKeyPressed = function (sketch, keyCode) {
  if ( app.rotateKeyPressed <= 0 ) {
    return;
  }
  var rotateCount = app.rotateKeyPressed % 3
  for(var i = 0; i < rotateCount; i++) {
    app.block = rotateBlock(app.block, rotateCount)
  }

  app.rotateKeyPressed = 0
}

app.moveBlockIfKeyPressed = function (sketch, keyCode) {
  var e
  if ( app.lastKeyPressed !== keyCode ) {
    return
  }

  e = mapKeyCodeToEdge(sketch, keyCode)
  if ( !_.some(app.block, hasReachedWall(e)) ) {
    moveBlockTo(app.block, e)
  }
  // reset 
  app.lastKeyPressed = 0
}

app.controllBlockWhenBlockDown = function(){
  var ys
    ,isCompRows
    ,pos

  if ( _.some(app.block, hasReachedWall(app.BOTTOM)) ) {
    // copy the block controlled to grid
    app.block.forEach(function(n) { app.grid[n] = true })

    // list up block's Y coord
    ys = _.chain(app.block)
      .map(function(n){ return idx2Y(n) })
      .unique()
      .value()

    // check the row filled
    isCompRows = 
      _.map(ys, function(y) {
        var idx = coord2Idx([0,y])
        return _.chain(app.grid)
          .slice(idx, idx+app.GRID_WIDTH)
          .every()
          .value()
      })

    // down the blocks stacked above the row filled
    _.chain(ys)
      .zip(isCompRows)
      .sortBy(function(e){ return -e[0] })
      .filter(function(e){ return e[1] })
      .forEach(function(e){
        var idx = coord2Idx([0,e[0]])
        for ( i = idx; i < app.GRID_CELLS - app.GRID_WIDTH; i++) {
          app.grid[i] = app.grid[i+app.GRID_WIDTH] 
        }
      })
      .value()

    // next block will appear
    pos = Math.floor(app.GRID_WIDTH / 2)
    app.block = 
      _.map(
         app.TETRIMINO[_.random(0,app.TETRIMINO.length-1)]
         ,function(n){return n+app.GRID_CELLS})
  }
  else {
    // down the block controlled
    moveBlockTo(app.block, app.BOTTOM)
  }
}

app.sketchHandle = function(sketch) {
  sketch.setup = function() {
    sketch.frameRate(app.FRAME_RATE)
    sketch.createCanvas(app.CANVAS_WIDTH, app.CANVAS_HEIGHT)
  }

  // enable key setting
  // TODO: controll key custumize setting 2
  sketch.keyPressed = function() {
    switch(sketch.keyCode) {
      case sketch.UP_ARROW:
        app.rotateKeyPressed++
        break
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
    app.rotateBlockIfKeyPressed(sketch, sketch.UP_ARROW)
    app.moveBlockIfKeyPressed(sketch, sketch.LEFT_ARROW)
    app.moveBlockIfKeyPressed(sketch, sketch.RIGHT_ARROW)
    app.moveBlockIfKeyPressed(sketch, sketch.DOWN_ARROW)

    if ( (sketch.frameCount % app.BLOCK_DOWN_FRAME_INTERVAL) === 0 ) {
      app.controllBlockWhenBlockDown()
    }

    // draw block controlled 
    _.chain(app.block)
      .map(idx2Coord)
      .forEach(function(c,idx,arr){
        sketch.stroke(255)
        sketch.fill(0)
        sketch.rect(c[0] * app.GRID_SIZE, (app.GRID_HEIGHT-c[1]) * app.GRID_SIZE, app.GRID_SIZE, app.GRID_SIZE)
      },this)
      .value()

    // draw rest blocks
    app.grid.forEach(function(e,idx,arr){
      if (e) {
        var c = idx2Coord(idx)
        sketch.stroke(255)
        sketch.fill(0)
        sketch.rect(c[0] * app.GRID_SIZE, (app.GRID_HEIGHT-c[1]) * app.GRID_SIZE, app.GRID_SIZE, app.GRID_SIZE)
      }
    },this)
  }
}

var myp5 = new p5(app.sketchHandle)

