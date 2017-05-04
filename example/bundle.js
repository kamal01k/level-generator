(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
let intersect1D
const inRange = (idx, start, end) => (idx >= start) && (idx <= end)


// returns the intersecting parts of 2 1D line segments, or null
module.exports = (intersect1D = function(startA, endA, startB, endB) {
  // determine full extent
  let end
  const min = Math.min(startA, startB)
  const max = Math.max(endA, endB)

  if (min === max) {
    return [ min, min ]
  }

  let begin = null
  for (let idx = min, end1 = max, asc = min <= end1; asc ? idx <= end1 : idx >= end1; asc ? idx++ : idx--) {
    if (begin === null) {
      if (inRange(idx, startA, endA) && inRange(idx, startB, endB)) {
        begin = idx
      }
    } else {
      if (inRange(idx, startA, endA) && inRange(idx, startB, endB)) {
        end = idx
      } else {
        end = end || begin
        return [ begin, end ]
      }
    }
  }

  if (!begin) { return null }

  end = end || begin
  return [ begin, end ]
})

},{}],2:[function(require,module,exports){
let expandAABB
const expansionVectors = {
  NORTH: { x: 0, y: -1, width: 0, height: 1 },
  SOUTH: { x: 0, y: 0, width: 0, height: 1 },
  EAST : { x: 0, y: 0, width: 1, height: 0 },
  WEST : { x: -1, y: 0, width: 1, height: 0 }
}


const PROPS = [ 'x', 'y', 'width', 'height']

module.exports = (expandAABB = function(aabb, direction, amount) {
  if (amount == null) { amount = 1 }
  const result = {}

  for (let dim of Array.from(PROPS)) {
    result[dim] = aabb[dim] + (expansionVectors[direction][dim] * amount)
  }

  return result
})

},{}],3:[function(require,module,exports){
/*
This test uses a separating axis test, which checks for overlaps between the
two boxes on each axis. If either axis is not overlapping, the boxes aren’t
colliding.
*/
let intersectAABB
module.exports = (intersectAABB = function(rect, rect2) {
  const dx = (rect2.x + (rect2.width/2)) - (rect.x + (rect.width/2))
  const px = ((rect2.width/2) + (rect.width/2)) - Math.abs(dx)
  if (px <= 0) { return false }

  const dy = (rect2.y + (rect2.height/2)) - (rect.y + (rect.height/2))
  const py = ((rect2.height/2) + (rect.height/2)) - Math.abs(dy)
  if (py <= 0) { return false }

  return true
})

},{}],4:[function(require,module,exports){
let moveAABB
const movementVectors = {
  NORTH: { x: 0, y: -1 },
  SOUTH: { x: 0, y: 1 },
  EAST:  { x: 1, y: 0 },
  WEST:  { x: -1, y: 0 }
}


module.exports = (moveAABB = function(aabb, direction, amount) {
  if (amount == null) { amount = 1 }
  const vec = movementVectors[direction]
  if ((!(amount > 0)) || !vec) { return aabb }
  aabb.x += (vec.x * amount)
  aabb.y += (vec.y * amount)
  return aabb
})

},{}],5:[function(require,module,exports){
// determine if an AABB overlaps a set of existing AABBs
let overlaps
const intersects = require('./aabb-intersect')


const aabbs = []  // simple AABB object pool

// return true if 2 rectangles overlap. minPadding specifies minimum spacing
// between the rectangles
module.exports = (overlaps = function(rectA, rectB, minPadding) {
  if (minPadding == null) { minPadding = 1 }
  let b = aabbs.pop()
  if (!b) {
    b = {x: 0, y: 0, width: 0, height: 0}
  }

  b.x = rectB.x
  b.y = rectB.y
  b.width = rectB.width
  b.height = rectB.height

  // inflate the size of rectB by 1 unit in each dimension
  b.x -= minPadding
  b.width += (minPadding * 2)

  b.y -= minPadding
  b.height += (minPadding * 2)

  // check rectA and the inflated rectB for overlap
  const result = intersects(rectA, b)
  aabbs.push(b)
  return result
})

},{"./aabb-intersect":3}],6:[function(require,module,exports){
let getPortal
const intersect1D = require('./1d-intersect')


// really nice line segment intersection test:
// https://github.com/tmpvar/segseg/blob/master/test/index.js

// given 2 AABBs, determine the portal (line segment) spanning the
// open space that connects them. returns null if they aren't adjacent
module.exports = (getPortal = function(aabb, next) {
  // check if AABBs are lined up on x axis ( side by side with 1 space between)
  let intersection, x
  if (((aabb.x+aabb.width) === next.x)  ||  ((aabb.x) === (next.x + next.width))) {
    intersection = intersect1D(aabb.y, aabb.y+aabb.height, next.y, next.y+next.height)

    if (!intersection) { return null }

    if ((aabb.x+aabb.width) === next.x) {
      x = aabb.x+aabb.width
    } else {
      x = next.x + next.width
    }

    return [ { x, y: intersection[0] }, { x, y: intersection[1] } ]
  }

  // check if aabbs are lined up on y axis ( on top of each other with 1 space between)
  if (((aabb.y+aabb.height) === next.y)  ||  ((aabb.y) === (next.y + next.height))) {
    let y
    intersection = intersect1D(aabb.x, aabb.x+aabb.width, next.x, next.x+next.width)

    if (!intersection) { return null }

    if ((aabb.y+aabb.height) === next.y) {
      y = aabb.y+aabb.height
    } else {
      y = next.y + next.height
    }

    return [ { x: intersection[0], y }, { x: intersection[1], y } ]
  }

  return null
})

},{"./1d-intersect":1}],7:[function(require,module,exports){
class Anteroom {
  constructor(centerX, centerY, tunnelWidth) {
    this.type = 'anteroom'
    this.to = {}

    // TODO: build a large or small anteroom depending on size available (build largest possible)
    //       small: tunnelWidth + 1    large: tunnelWidth + 3

    // determine anteroom size based on tunnel width
    const roomRadius = tunnelWidth + 1
    this.x = centerX - roomRadius
    this.y = centerY - roomRadius

    // anteroom is always odd width/height
    this.width = (roomRadius * 2) + 1
    this.height = (roomRadius * 2) + 1
  }


  // given a direction, return the aabb for the exit centered on that edge where the door would be
  // e.g., getCenteredExitPosition('NORTH') give the x,y position on the top center exit
  getCenteredDoor(direction) {
    const aabb = { width: 1, height: 1 }
    const halfHeight = this.height/2
    const halfWidth = this.width/ 2

    if (direction === 'EAST') {
      aabb.x = this.x + this.width
      aabb.y = Math.floor(this.y + halfHeight)
    } else if (direction === 'WEST') {
      aabb.x = this.x - 1
      aabb.y = Math.floor(this.y + halfHeight)
    } else if (direction === 'NORTH') {
      aabb.x = Math.floor(this.x + halfWidth)
      aabb.y = this.y - 1
    } else {
      aabb.x = Math.floor(this.x + halfWidth)
      aabb.y = this.y + this.height
    }
    return aabb
  }


  // given a direction, return the aabb for the exit centered on that edge
  // e.g., getCenteredExitPosition('NORTH') give the x,y position on the top center exit
  getCenteredExit(direction) {
    const aabb = { width: 1, height: 1 }
    if (direction === 'EAST') {
      aabb.x = (this.x + this.width) - 1
      aabb.y = Math.floor(this.y + (this.height/2))
    } else if (direction === 'WEST') {
      aabb.x = this.x
      aabb.y = Math.floor(this.y + (this.height/2))
    } else if (direction === 'NORTH') {
      aabb.x = Math.floor(this.x + (this.width/2))
      aabb.y = this.y
    } else {
      aabb.x = Math.floor(this.x + (this.width/2))
      aabb.y = (this.y + this.height) - 1
    }
    return aabb
  }


  isValid(level, parentTunnel) {
    if (!level.contains(this)) { return false }

    // anteroom must not overlap with existing level rooms/tunnels/anterooms
    const minRoomSpacing = 1
    const minAnteroomSpacing = 1
    const minTunnelSpacing = 0
    const ignoreEntity = parentTunnel
    if (level.overlaps(this, minRoomSpacing, minAnteroomSpacing, minTunnelSpacing, ignoreEntity)) {
      return false
    }
    return true
  }
}


module.exports = Anteroom

},{}],8:[function(require,module,exports){
let buildGraph
const getPortal = require('./aabb-portal')


// build graph of connected room doors, anterooms, and tunnels
module.exports = (buildGraph = function(objects) {
  // create all of the connection data structures
  for (var obj of Array.from(objects)) {
    obj.to = {}
  }

  return (() => {
    const result = []
    for (obj of Array.from(objects)) {
      result.push(objects.forEach(function(entity, idx) {
        if (entity.id !== obj.id) {
          const portal = getPortal(obj, entity)
          if (portal) {
            obj.to[entity.id] = {entity, portal}
            return entity.to[obj.id] = {entity: obj, portal}
          }
        }
      }))
    }
    return result
  })()
})

},{"./aabb-portal":6}],9:[function(require,module,exports){
module.exports = {
  OPEN: 0,
  DOOR_NORTH_SOUTH: 1,
  DOOR_EAST_WEST: 2,
  ROOM: 3,
  ROOM_PREFAB: 4,
  ANTEROOM: 5,
  TUNNEL: 6
}

},{}],10:[function(require,module,exports){
module.exports = {
  // the default random seed that will be used when this design file is first used in a program run.
  // enabling this line will result in the same random numbers used each time, making random levels reproducible

  // weird tunnel overlap with prefab room caused by something in _mergeTunnels()
  //randSeed: 0.7956894984385063

  //randSeed: 0.05407006067002862

  // produces very nice looking level, harcode this to test with for now
  //randSeed: 0.9342698135762848,

  // dimensions of the level to create
  dimensions: {
    width : 350,
    height: 250
  },

  // initial "prefab" rooms
  // these rooms are special, in that they can't be tunneled into.
  // useful when you want to place predefined elements in an area.
  rooms: [
    {
      x: 20,
      y: 20,
      width: 13,
      height: 9,
      doors: [
        {
          x: 33,
          y: 26,
          width: 1,
          height: 1
        }
      ]
    },
    {
      x: 200,
      y: 100,
      width: 17,
      height: 13,
      doors: [
        {
          x: 199,
          y: 105,
          width: 1,
          height: 1
        }
      ]
    },
    {
      x: 90,
      y: 200,
      width: 7,
      height: 5,
      doors: [
        {
          x: 89,
          y: 202,
          width: 1,
          height: 1
        }
      ]
    }
  ],

  //  the following parameters are very important: Builders born in
  //  earlier generations will tend to dominate (fill) the map

  //  probabilities that a baby Roomie will be born after i generations
  //  indices above 10 are illegal, enter integer values for all 11 indices
  //       i =   0    1    2     3    4    5    6    7    8    9    10
  babyRoomie: [ 0,   0,   50,   50,  0,   0,   0,   0,   0,   0,   0 ],
  //  values must add up to 100


  babyTunnelers: {
    //  probabilities that a baby Tunneler will be born after i generations
    //  (applicable only for those Tunnelers who are not larger than their parents -
    //  - for those larger than their parents, use sizeUpGenDelay)
    //  indices above 10 are illegal, enter integer values for all 11 indices
    //                       i =   0    1    2      3    4    5    6    7    8    9    10
    generationBirthProbability: [ 0,   0,   100,   0,   0,   0,   0,   0,   0,   0,   0 ],
    //  values must add up to 100

    //  probabilities that a baby Tunneler of generation gen will have a tunnelWidth 2 size larger than its parent
    //  last value is repeated for further generations
    //            gen =   0   1    2    3   4   5     6     7    8   9   10  11 12 13 14 15 16 17 18 19 20
    sizeUpProbability: [ 0,  50,  50,  0,  0,  75,  75,  30 ],


    //  probabilities that a baby Tunneler of generation gen will have a tunnelWidth 2 size smaller than its parent
    //  last value is repeated for further generations
    //              gen =   0   1   2    3     4     5   6   7    8   9   10  11 12 13 14 15 16 17 18 19 20
    sizeDownProbability: [ 0,  0,  50,  100,  100,  0,  0,  70 ],

    //  for every generation, 100 - (sizeUpProb(gen) + sizeDownProb(gen) = probability that size remains the same,
    //  and this value must be >= 0
    //  in this example tunnels first get narrower, then rapidly larger in generation 5
    //  this ensures that larger tunnels are far from the entrance
    //  actually, the level is too small to let that happen
    //  after generation 6 there is a random element, tunnels can get larger or smaller

    // high values make the tunneler prefer to join another tunnel or open space
    // low values means it prefers to end its run by building a room
    // last value is repeated for further generations
    //            gen = 0   1   2    3     4
    joinProbability: [ 0,  0,  10,  100,  100 ]
  },


  //  probability that a Tunneler will make an anteroom when changing direction or spawning
  //      tunnelWidth =   0    1    2   3   4    5    6    7    8   ...
  anteroomProbability: [ 20,  30,  0,  0,  100 ],
  //  value 100 ends the input and repeats for larger tunnels
  //  here we have anterooms only on narrow tunnels
  //  these parameters are important for the appearance of the level

  roomSizes: {
    small: [ 20, 39 ],
    medium: [ 40, 79 ],
    large: [ 80, 150 ]
  },

  maxRooms: {
    small: 400,
    medium: 120,
    large: 16
  },


  //  probabilities to use a room of a certain size depending on tunnelWidth
  roomSizeProbability: {
    // rooms coming out sideways from the tunnel. index specifies tunnel width
    sideways: [
      {
        small: 100,
        medium: 0,
        large: 0
      },
      {
        small: 50,
        medium: 50,
        large: 0
      },
      {
        small: 0,
        medium: 100,
        large: 0
      },
      {
        small: 0,
        medium: 0,
        large: 100
      }
    ],
    // rooms at branching sites. index specifies tunnel width
    branching: [
      {
        small: 100,
        medium: 0,
        large: 0
      },
      {
        small: 0,
        medium: 100,
        large: 0
      },
      {
        small: 0,
        medium: 0,
        large: 100
      }
    ]
  },
  //  all probabilities should add up to 100 per tunnel width
  //  input ends when large is at 100, then repeats at 100% large rooms
  //  very important - use this to make sure that larger rooms are on larger tunnels


  //  maxSteps for generations of Tunneler. last value is repeated for further generations
  //             gen = 0   1    2    3    4    5    6    7    8    9    10   11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30
  tunnelerMaxSteps: [ 5,  12,  12,  15,  15,  15,  15,  15,  15,  20,  30,  10, 15, 10, 3,  20, 10, 5,  15, 10, 5,  20, 20, 20, 20, 10, 20, 5,  20, 5,  0 ],


  // changes Tunneler parameters between generations. less change with smaller mutator
  mutator: 20,

  // roomAspectRatio <= length/width and width/length of rooms must be larger than this
  roomAspectRatio: 0.4,

  // probability that 2 adacent rooms will be connected to each other via a door (0 is 0%, 1 is 100%)
  roomConnectionProbability: 0.4,

  // the normal generational delay is divided by this value to give the actual generational delay -
  // to prevent anterooms without tunnels branching off them, an ugly sight if too frequent
  //genSpeedUpOnAnteRoom: 4

  // the minimum amount of space required between rooms
  minRoomSpacing: 1,

  // "last-chance-Tunnelers" are created when a Tunneler runs out of room
  lastChanceTunneler: {
    makeRoomsLeftProb: 100,
    makeRoomsRightProb: 100,
    changeDirectionProb: 40,
    straightDoubleSpawnProb: 30,
    turnDoubleSpawnProb: 80,
    // high values make the tunneler prefer to join another tunnel or open space
    // low values it prefers to end its run by building a room
    joinProb: 50
  },

  // used for tunnelers that are created at room exits
  roomExitTunneler: {
    // tunneler will be deleted after having made at most maxSteps steps
    maxSteps: 12,
    // the generation this tunneler will be born
    generation: 0,
    // number of squares covered in one step
    stepLength: 7,
    tunnelWidth: 1,
    straightDoubleSpawnProb: 40,
    turnDoubleSpawnProb: 60,
    // probability that the tunneler changes direction at the end of one step
    changeDirectionProb: 40,
    makeRoomsRightProb: 100,
    makeRoomsLeftProb: 100,
    // high values make the tunneler prefer to join another tunnel or open space
    // low values it prefers to end its run by building a room
    joinProb: 50
  },


  tunnelers: [ ]
};

},{}],11:[function(require,module,exports){
class Door {
  constructor(init) {
    Object.assign(this, init)
    this.type = 'door'
    //this.direction = null
    this.to = {}
  }
}

module.exports = Door

},{}],12:[function(require,module,exports){
'use strict'

const Generator = require('../')
const raf       = require('raf')


function render(dungeon, ctx) {
  let i, len, o
  ctx.clearRect(0, 0, 3000, 3000)
  const ref = dungeon.objects
  const results = []
  for (i = 0, len = ref.length; i < len; i++) {
    o = ref[i]
    if (o.type === 'door') {
      if (!o.KEEP) {
        ctx.fillStyle = '#0F0'
      } else {
        ctx.fillStyle = '#f00'
      }
      //ctx.fillStyle = 'rgba(255,0,0, 0.3)'
    } else if (o.type === 'room') {
      if (o.prefab) {
        ctx.fillStyle = '#f2ce3d'
      } else {
        //ctx.fillStyle = 'rgba(255,255,255, 0.3)'
        ctx.fillStyle = '#fff'
      }
    } else if (o.type === 'anteroom') {
      if (o.KEEP) {
        ctx.fillStyle = 'rgba(0,160,245, 0.9)'
      } else {
        ctx.fillStyle = 'rgba(255,0,245, 0.9)'
      }
    } else if (o.type === 'tunnel') {
      if (o.KEEP) {
        ctx.fillStyle = 'rgba(0,160,245, 0.9)'
      } else {
        ctx.fillStyle = 'rgba(255,0,245, 0.9)'
      }
    }
    results.push(ctx.fillRect(o.x, o.y, o.width, o.height))
  }
  return results
}


const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
let ratio = window.devicePixelRatio || 1

const w = 2000 // level.design.dimensions.width
const h = 2000 // level.design.dimensions.height
const scale = 3

canvas.width = w * ratio * scale
canvas.height = h * ratio * scale

canvas.style.width = w * scale + 'px'
canvas.style.height = h * scale + 'px'

ctx.scale(scale, scale)

const theme = 'RESEARCH'
const level = new Generator(null, null, theme)

level.build()

console.log('complete!', level)

render(level, ctx)

canvas.addEventListener('mousedown', function(ev) {
  ratio = window.devicePixelRatio || 1
  const x = Math.floor(ev.layerX / scale * ratio)
  const y = Math.floor(ev.layerY / scale * ratio)

  // find all items under the clicked x,y position
  level.objects.forEach(function(entity) {
    if (x >= entity.x && x <= (entity.x + entity.width - 1)) {
      if (y >= entity.y && y <= (entity.y + entity.height - 1)) {
        console.log('hit:', entity)
      }
    }
  })
})

},{"../":18,"raf":16}],13:[function(require,module,exports){

},{}],14:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.12.2
(function() {
  var getNanoSeconds, hrtime, loadTime, moduleLoadTime, nodeLoadTime, upTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - nodeLoadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    moduleLoadTime = getNanoSeconds();
    upTime = process.uptime() * 1e9;
    nodeLoadTime = moduleLoadTime - upTime;
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);



}).call(this,require('_process'))
},{"_process":15}],15:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],16:[function(require,module,exports){
(function (global){
var now = require('performance-now')
  , root = typeof window === 'undefined' ? global : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = root['request' + suffix]
  , caf = root['cancel' + suffix] || root['cancelRequest' + suffix]

for(var i = 0; !raf && i < vendors.length; i++) {
  raf = root[vendors[i] + 'Request' + suffix]
  caf = root[vendors[i] + 'Cancel' + suffix]
      || root[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  return raf.call(root, fn)
}
module.exports.cancel = function() {
  caf.apply(root, arguments)
}
module.exports.polyfill = function() {
  root.requestAnimationFrame = raf
  root.cancelAnimationFrame = caf
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"performance-now":14}],17:[function(require,module,exports){
// given an array, get the value at the given index. if the index is larger than
// the array, return the last element

let getValue
module.exports = (getValue = function(arr, index) {
  if (arr.length === 0) {
    console.log('ERROR: array length is zero')
    return null
  }
  if (index >= arr.length) {
    return arr[arr.length-1]
  }
  return arr[index]
})

},{}],18:[function(require,module,exports){
const Anteroom      = require('./anteroom')
const Door          = require('./door')
const QuadTree      = require('./qtree')
const Room          = require('./room')
const Roomie        = require('./roomie')
const Tunneler      = require('./tunneler')
const buildGraph    = require('./build-graph')
const constants     = require('./constants')
const designDefault = require('./design-default')
const expandAABB    = require('./aabb-expand')
const getPortal     = require('./aabb-portal')
const intersect1D   = require('./1d-intersect')
const intersectAABB = require('./aabb-intersect')
const levelFurnish  = require('./level-furnish')
const moveAABB      = require('./aabb-move')
const overlaps      = require('./aabb-overlaps')
const random        = require('./random')
const removeItems   = require('remove-array-items')
const seed          = require('seedrandom')
const turn90        = require('./turn-90')
//const zeros         = require('zeros')


// global constants
const ENTITIES = [ 'tunnels', 'rooms', 'anterooms', 'doors' ]


class LevelGenerator {
  constructor(design, seedValue, theme) {
    let t
    if (design == null) { design = designDefault }
    if (seedValue == null) { seedValue = null }
    this.theme = theme
    this.design = JSON.parse(JSON.stringify(design))
    this.objects = []
    this.workers = []
    this.generation = 0

    // stores references to items, which speeds up AABB overlap checks
    this.qtree = new QuadTree(0, 0, this.design.dimensions.width, this.design.dimensions.height)

    // if present, use the design file's seed for reproducible random numbers
    random.seed(seedValue || this.design.randSeed)

    // build a tunneler for each one specified in the design
    for (var init of Array.from(this.design.tunnelers)) {
      t = new Tunneler(this, this.design, init)
      this.workers.push(t)
    }

    // add predefined rooms to the level from the design
    for (let roomInit of Array.from(this.design.rooms)) {
      const r = new Room(roomInit)
      r.prefab = true // flag room as prefab to prevent tunneling into it later
      this.addEntity(r)

      // put a tunneler at every prefab room door facing the exit
      for (let door of Array.from(r.doors)) {
        const d = new Door(door)
        this.addEntity(d)
        init = JSON.parse(JSON.stringify(this.design.roomExitTunneler))
        init.x = door.x
        init.y = door.y
        init.direction = r.findExitDirection(door)
        d.direction = init.direction
        t = new Tunneler(this, this.design, init)
        this.workers.push(t)
      }

      // rooms don't contain doors, so remove them
      delete r.doors
    }

    this.roomCount = {small: 0, medium: 0, large: 0}
  }


  addEntity(entity) {
    entity.id = this.objects.length
    this.objects.push(entity)
    return this.qtree.put(entity)
  }


  build() {
    let built = false
    while (!built) {
      let entities = this.workers.filter(o => o.generation === this.generation)
      for (let e of Array.from(entities)) {
        if (!e.step()) {
          this._removeWorker(e.id)
        }
      }

      // when there are no roomies/tunnelers in the current generation, advance
      entities = this.workers.filter(o => o.generation === this.generation)
      if (entities.length === 0) {
        this.generation++
      }

      if (this.workers.length === 0) {
        built = true
      }

      setTimeout(
        function() {},
        0
      )
    }

    return this._postBuildStep()
  }


  // determine if an AABB is fully inside the level dimensions
  contains(aabb) {
    const minPadding = 1 // ensure there is a 1 unit border around the level edge
    if ((aabb.x < minPadding) || (aabb.y < minPadding)) {
      return false
    }
    if (((aabb.x + aabb.width) > (this.design.dimensions.width - minPadding)) ||
    ((aabb.y + aabb.height) > (this.design.dimensions.height - minPadding))) {
      return false
    }
    return true
  }


  // determine the largest room that fits at the given level position
  findLargestRoom(doorPosition, direction, maxSize) {
    const leftDirection = turn90(direction, 'LEFT')
    const rightDirection = turn90(direction, 'RIGHT')

    const directionVectors = {
      forward: direction,
      left: leftDirection,
      right: rightDirection
    }

    const expand = {forward: true, left: true, right: true}

    // move to the first position in the room (right in front of the door)
    let result = { x: doorPosition.x, y: doorPosition.y, width: 1, height: 1 }
    moveAABB(result, directionVectors.forward)

    // Grow in all directions from the door. When overlapping or adjacent to an
    // object, stop growing in that direction. When growing stops in all
    // directions, we've found the largest room that fits in this area.
    const minTunnelSpacing = 1
    const minAnteroomSpacing = 1

    while (expand.left || expand.right || expand.forward) {
      for (let dir in expand) {
        const exp = expand[dir]
        if (exp) {
          const cardinalDirection = directionVectors[dir]
          const test = expandAABB(result, cardinalDirection)
          if ((test.width * test.height) > maxSize) {
            return result
          }

          // ensure room aspect ratio are within acceptable limits
          if ((test.width / test.height) < this.design.roomAspectRatio) {
            return result
          }
          if ((test.height / test.width) < this.design.roomAspectRatio) {
            return result
          }

          if (!this.contains(test)) {
            // expanded outside of level dimensions, reject this expansion
            expand[dir] = false
          } else {
            if (this.overlaps(test, this.design.minRoomSpacing, minAnteroomSpacing, minTunnelSpacing)) {
              expand[dir] = false
            } else {
              result = test
            }
          }
        }
      }
    }
    return result
  }


  // determine if an entity's AABB overlaps any existing level items
  overlaps(aabb, minRoomSpace, minAnteroomSpace, minTunnelSpace, ignoreEntity) {
    if (ignoreEntity == null) { ignoreEntity = null }
    const spacing = {
      room: minRoomSpace,
      anteroom: minAnteroomSpace,
      tunnel: minTunnelSpace,
      door: 0
    }

    const toCheck = this.qtree.get(aabb)

    for (let item of Array.from(toCheck)) {
      const minSpacing = spacing[item.type]
      if ((ignoreEntity != null ? ignoreEntity.id : undefined) !== item.id) {
        if (overlaps(aabb, item, minSpacing)) {
          return item
        }
      }
    }

    return null
  }


  // given 2 level rooms, determine a random space between them to place a valid door.
  // returns null if door can't be placed
  _getAdjacentRoomDoorPosition(room, next) {
    // check if rooms are lined up on x axis ( side by side with 1 space between)
    let intersection, length, x, y
    if (((room.x+room.width) === (next.x - 1))  ||  ((room.x) === (next.x + next.width + 1))) {
      intersection = intersect1D(room.y, room.y+room.height, next.y, next.y+next.height)
      if (!intersection) { return null }

      length = (intersection[1] - intersection[0])
      y = intersection[0] + Math.round(random.next() * length)
      if ((room.x+room.width) === (next.x - 1)) {
        x = room.x+room.width
      } else {
        x = next.x + next.width
      }
      // TODO: ensure the space isnt occupied with anything
      return { x, y, direction: 'EAST' }
    }

    // check if rooms are lined up on y axis ( on top of each other with 1 space between)
    if (((room.y+room.height) === (next.y - 1))  ||  ((room.y) === (next.y + next.height + 1))) {
      intersection = intersect1D(room.x, room.x+room.width, next.x, next.x+next.width)
      if (!intersection) { return null }

      length = (intersection[1] - intersection[0])
      x = intersection[0] + Math.round(random.next() * length)

      if ((room.y+room.height) === (next.y - 1)) {
        y = room.y+room.height
      } else {
        y = next.y + next.height
      }
      // TODO: ensure the space isnt occupied with anything
      return { x, y, direction: 'NORTH' }
    }
    return null
  }


  // get list of all adjacent but unconnected rooms
  _getAdjacentRooms(room) {
    const results = []
    if (room.prefab) {
      // don't connect from prefab rooms
      return results
    }

    const rooms = this.objects.filter(o => o.type === 'room')

    for (let next of Array.from(rooms)) {
      // don't connect to prefab rooms
      if (!next.prefab) {
        if (next.id !== room.id) {
          if (!this._roomsAreConnected(room, next)) {
            const doorPosition = this._getAdjacentRoomDoorPosition(room, next)
            if (doorPosition) {
              results.push({room: next, doorPosition })
            }
          }
        }
      }
    }
    return results
  }


  _roomsAreConnected(room, next) {
    for (let id in room.to) {
      const item = room.to[id]
      if ((item.entity.type === 'door') && item.entity.to[next.id]) {
        return true
      }
    }
    return false
  }


  _connectRoomsRandomly() {
    let adjacentRooms
    const rooms = this.objects.filter(o => o.type === 'room')
    return Array.from(rooms).map((room) =>
      // get all adjacent but unconnected rooms
      ((adjacentRooms = this._getAdjacentRooms(room)),
      (() => {
        const result = []
        for (let next of Array.from(adjacentRooms)) {
        // link some adjacent rooms
          let item
          const diceRoll = random.next()
          if (diceRoll <= this.design.roomConnectionProbability) {
            const d = new Door({ x: next.doorPosition.x, y: next.doorPosition.y, width: 1, height: 1, direction: next.doorPosition.direction })
            d.KEEP = true
            this.addEntity(d)

            // link the door to the 2 rooms

            let portal = getPortal(d, room)
            d.to[room.id] = {entity: room, portal}
            room.to[d.id] = {entity: d, portal}

            portal = getPortal(d, next.room)
            d.to[next.room.id] = {entity: next.room, portal}
            item = next.room.to[d.id] = {entity: d, portal}
          }
          result.push(item)
        }
        return result
      })()))
  }


  // determine if there's a path between 2 level entities
  _isConnected(src, dest) {
    const visited = {}
    const toVisit = [ src ]

    while (toVisit.length) {
      const next = toVisit.pop()
      if (next.id === dest.id) {
        return true
      }
      if (!visited[next.id]) {
        visited[next.id] = true
        for (let id in next.to) { const child = next.to[id]; toVisit.push(child.entity) }
      }
    }

    return false
  }


  // determine if all prefabs are reachable from each other
  _isFullyConnected() {
    const prefabs = []
    const rooms = this.objects.filter(o => o.type === 'room')
    for (let room of Array.from(rooms)) {
      if (room.prefab) {
        prefabs.push(room)
      }
    }

    if (!(prefabs.length > 1)) { return true }

    for (let prefabA of Array.from(prefabs)) {
      for (let prefabB of Array.from(prefabs)) {
        if (prefabA.id > prefabB.id) {
          if (!this._isConnected(prefabA, prefabB)) {
            return false
          }
        }
      }
    }
    return true
  }


  _getEntranceAndExitRooms() {
    const rooms = this.objects.filter(o => o.type === 'room')
    if (rooms.length === 0) {
      return null
    }

    if (rooms.length === 1) {
      return [rooms[0], rooms[0]]
    }

    const entranceIndex = Math.floor(random.next() * rooms.length)
    while (true) {
      const exitIndex = Math.floor(random.next() * rooms.length)
      if (exitIndex !== entranceIndex) {
        return [ rooms[entranceIndex], rooms[exitIndex] ]
      }
    }

    return null
  }


  _getLevelMetrics(aabbs, levelWidth, levelHeight) {
    /*
    * cave related metric. not useful at the moment.
    * number of items directly connected to, and how many it's neighbors are connected to
    for obj in @objects
      obj.caveConnectedness = Object.keys(obj.to).length
      for id, child of obj.to
        obj.caveConnectedness += Object.keys(child.to).length
    */


    // tunneling generated levels are highly connected. rate all rooms by
    // seclusion: the distance from the fastest path the player can take between
    // an entrance and the exit(s)

    // TODO: use BFS to find the fastest path between any 2 entrance/exit pairs.

    const totalArea = levelWidth * levelHeight

    let maxSeclusion = 0
    let totalSeclusion = 0
    const rooms = this.objects.filter(o => o.type === 'room')
    for (let room of Array.from(rooms)) {
      room.seclusionFactor = 0 // TODO: pathfind from the room entrance to the closest point on any of the egress paths
      totalSeclusion += room.seclusionFactor
      maxSeclusion = Math.max(maxSeclusion, room.seclusionFactor)
    }

    const metrics = {
      seclusion: {
        average: totalSeclusion / (rooms.length || 1),
        max: maxSeclusion
      },
      playableSpace: 0, // ratio. 0 means fully closed, 1 is fully open
      goalDistance:  0, // distance from entrance to exit (e.g., 7 entities between entrance and exit)
      composition: {     // histogram of cell values
        CLOSED: totalArea,
        DOOR: 0,
        ROOM: 0,
        ROOM_PREFAB: 0,
        TUNNEL: 0,
        ANTEROOM: 0
      }
    }

    for (let obj of Array.from(aabbs)) {
      let area = obj.width * obj.height
      if (obj.type === 'door') {
        metrics.composition.DOOR += area
      } else if (obj.type === 'anteroom') {
        metrics.composition.ANTEROOM += area
      } else if (obj.prefab) {
        metrics.composition.ROOM_PREFAB += area
      } else if (obj.type === 'room') {
        metrics.composition.ROOM += area
      } else if (obj.type === 'tunnel') {
        metrics.composition.TUNNEL += area
      } else {
        area = 0
      }

      metrics.composition.CLOSED -= area
    }

    metrics.playableSpace = (totalArea - metrics.composition.CLOSED) / totalArea
    return metrics
  }


  _postBuildStep() {
    // generate a graph from all of the level objects
    buildGraph(this.objects)

    if (!this._isFullyConnected()) {
      console.log('rejected level, not fully connected')
      return null
    }

    this._removeRedundantTunnelLoops()

    const metrics = this._getLevelMetrics(this.objects, this.design.dimensions.width, this.design.dimensions.height)
    console.log('playable space:', metrics.playableSpace, ' m', metrics)

    const r = (metrics.composition.ROOM + metrics.composition.ROOM_PREFAB) / (metrics.composition.TUNNEL + metrics.composition.ANTEROOM)

    console.log('room:tunnel ratio', r)
    if (r < 1.1) {
      console.log('rejected level, room:tunnel ratio too low')
      return null
    }

    this._connectRoomsRandomly()

    //r = @_getEntranceAndExitRooms()
    //if r
    //  console.log 'start room:', r[0]
    //  console.log 'end room:', r[1]

    // TODO: combine compatible tunnels (same direction, tunnelWidth, and position)
    //@_mergeTunnels()

    this._compactEntities()

    const TILE_SIZE = 32
    return this._makeLevel(TILE_SIZE)
  }


  _makeLevel(TILE_SIZE) {
    let next
    const level = {
      cells: this._buildGrid(),
      objects: [],
      cols: this.design.dimensions.width,
      rows: this.design.dimensions.height
    }

    // convert portal coordinates from tiles to pixels
    for (let obj of Array.from(this.objects)) {
      for (let id in obj.to) {
        next = obj.to[id]
        if (!next.portal.converted) {

          next.portal.converted = true
          next.portal[0].x *= TILE_SIZE
          next.portal[0].y *= TILE_SIZE
          next.portal[1].x *= TILE_SIZE
          next.portal[1].y *= TILE_SIZE
        }
      }
    }

    // convert doors to level objects
    const doors = this.objects.filter(o => o.type === 'door')

    for (let door of Array.from(doors)) {
      next = {
        type: 'door',
        properties: {
          x: door.x * TILE_SIZE,
          y: door.y * TILE_SIZE,
          doorSpeed: 0.3
        }
      }

      if ((door.direction === 'NORTH') || (door.direction === 'SOUTH')) {
        next.properties.direction = 'EAST-WEST'
        next.properties.width = TILE_SIZE
        next.properties.height = TILE_SIZE / 4
      } else {
        next.properties.direction = 'NORTH-SOUTH'
        next.properties.width = TILE_SIZE / 4
        next.properties.height = TILE_SIZE
      }

      level.objects.push(next)
    }

    const machines = levelFurnish(this.objects, this.theme)

    // convert machines from tiles to pixels and add to the level objects
    for (let machine of Array.from(machines)) {
      machine.type = 'machine'
      machine.x *= TILE_SIZE
      machine.y *= TILE_SIZE
      machine.width *= TILE_SIZE
      machine.height *= TILE_SIZE
      level.objects.push(machine)
    }

    const startRoom = this.objects.find(o => o.type === 'room')

    const playerSpawn = {
      type: 'player-spawn',
      x: startRoom.x + 1,
      y: startRoom.y + 1
    }

    playerSpawn.x *= TILE_SIZE
    playerSpawn.y *= TILE_SIZE

    level.objects.push(playerSpawn)

    return level
  }


  _removeWorker(id) {
    let idx = 0
    for (let worker of Array.from(this.workers)) {
      if (worker.id === id) {
        removeItems(this.workers, idx, 1)
        return
      }
      idx++
    }
  }


  // find path from start to end
  // returns the length of the path
  findPath(start, end, path) {
    let pathLength = 0

    const frontier = [ start ]
    // TODO: store portals in came_from
    const came_from = {}
    came_from[start.id] = start.id
    while (frontier.length) {
      let current = frontier.shift()
      if (current.id === end.id) {
        // record the path
        current = end
        while (current !== start.id) {
          //path[pathLength] = x
          //path[pathLength+] = y
          current = came_from[current.id]
          pathLength += 2
        }

        return
      }
      for (let id in current.to) {
        const next = current.to[id]
        if (came_from[id] === undefined) {
          frontier.push(next)
          came_from[id] = current
        }
      }
    }

    return pathLength
  }


  _markRoomPath(start, end, came_from) {
    let current = end
    return (() => {
      const result = []
      while (current !== start.id) {
        current.KEEP = true
        result.push(current = came_from[current.id])
      }
      return result
    })()
  }


  _markAllRoomPaths(start) {
    const frontier = [ start ]
    const came_from = {}
    came_from[start.id] = start.id

    return (() => {
      const result = []
      while (frontier.length) {
        var current = frontier.shift()
        if ((current.id !== start.id) && (current.type === 'room')) {
          this._markRoomPath(start, current, came_from)
        }

        result.push((() => {
          const result1 = []
          for (let id in current.to) {
            const next = current.to[id]
            let item
            if (came_from[id] === undefined) {
              frontier.push(next.entity)
              item = came_from[id] = current
            }
            result1.push(item)
          }
          return result1
        })())
      }
      return result
    })()
  }


  _removeEntity(entity) {
    let idx = this.objects.length - 1
    while (idx >= 0) {
      let { id } = this.objects[idx]
      if (entity.id === id) {
        // remove all references to this entity
        for (id in this.objects[idx].to) {
          const neighbor = this.objects[idx].to[id]
          delete neighbor.entity.to[entity.id]
        }

        // remove the entity itself
        removeItems(this.objects, idx, 1)
        return
      }
      idx--
    }
  }


  _removeRedundantTunnelLoops() {
    const rooms = this.objects.filter(o => o.type === 'room')
    for (let room of Array.from(rooms)) { this._markAllRoomPaths(room) }

    // consider applying some heuristic, like allowing only X optional
    // tunnels in one area, etc.

    let idx = this.objects.length - 1
    return (() => {
      const result = []
      while (idx >= 0) {
        const obj = this.objects[idx]
        if (!obj.KEEP) {
          this._removeEntity(obj)
        }
        result.push(idx--)
      }
      return result
    })()
  }


  _compactEntities() {
    // since the level is represented with a 2d grid, minify level dimensions to
    // reduce the number of cells/memory needed

    // scan all entities, findining minimum (x,y) encountered
    let dx, dy
    let minX = null
    let minY = null
    for (var obj of Array.from(this.objects)) {
      if ((minX === null) || (obj.x < minX)) {
        minX = obj.x
      }

      if ((minY === null) || (obj.y < minY)) {
        minY = obj.y
      }
    }

    if (minX > 1) {
      dx = -(minX - 1)
    } else {
      dx = 0
    }

    if (minY > 1) {
      dy = -(minY - 1)
    } else {
      dy = 0
    }

    if (!dx && !dy) { return }

    // shift all entities by dx, dy
    return (() => {
      const result = []
      for (obj of Array.from(this.objects)) {
        obj.x += dx
        result.push(obj.y += dy)
      }
      return result
    })()
  }


  // TODO: rewrite this as a breadth-first graph traversal. I suspect this will
  // be shorter and faster
  // combine compatible tunnels (same direction, tunnelWidth, and position)
  _mergeTunnels() {
    const deleted = {}

    for (let obj of Array.from(this.objects)) {
      for (let obj2 of Array.from(this.objects)) {
        if (!(deleted[obj2.id] || deleted[obj.id])) {
          if (obj.id > obj2.id) {
            if ((obj.type === 'tunnel') && (obj2.type === 'tunnel')) {

              var max, min, width
              if (((obj.direction === 'EAST') || (obj.direction === 'WEST')) && ((obj2.direction === 'EAST') || (obj2.direction === 'WEST'))) {
                if ((obj.y === obj2.y) && (obj.height === obj2.height)) {
                  if (intersect1D(obj.x, obj.x + obj.width, obj2.x, obj2.x + obj2.width)) {
                    // they overlap, take the min/max extents
                    min = Math.min(obj.x, obj2.x)
                    max = Math.max(obj.x + obj.width, obj2.x + obj2.width)

                    width = (max - min) + 1
                    obj.x = min
                    obj.width = width

                    // TODO: connect all of obj2's neighbors to obj
                    deleted[obj2.id] = true  // mark object 2 as removed
                  }
                }
              }

              if (((obj.direction === 'NORTH') || (obj.direction === 'SOUTH')) && ((obj2.direction === 'NORTH') || (obj2.direction === 'SOUTH'))) {
                if ((obj.x === obj2.x) && (obj.width === obj2.width)) {
                  if (intersect1D(obj.y, obj.y + obj.height, obj2.y, obj2.y + obj2.height)) {
                    // they overlap, take the min/max extents
                    min = Math.min(obj.y, obj2.y)
                    max = Math.max(obj.y + obj.height, obj2.y + obj2.height)

                    const height = (max - min) + 1
                    obj.y = min
                    obj.height = height

                    // TODO: connect all of obj2's neighbors to obj

                    deleted[obj2.id] = true  // mark object 2 as removed
                  }
                }
              }
            }
          }
        }
      }
    }

    // remove all the tunnels marked for deletion
    let idx = this.objects.length - 1
    return (() => {
      const result = []
      while (idx >= 0) {
        const { id } = this.objects[idx]
        if (deleted[id]) {
          this._removeEntity(this.objects[idx])
        }
        result.push(idx--)
      }
      return result
    })()
  }


  // convert AABBs to grid, setting id of each item in cell.
  _buildGrid() {
    //grid = zeros [ @design.dimensions.width, @design.dimensions.height ]
    const grid = []

    // start with assuming all spaces are filled
    for (let i = 0, end = (this.design.dimensions.width*this.design.dimensions.height)-1, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
      grid.push(1)
    }


    // hollow out all entities (rooms, anteroom, tunnels, etc.)
    for (let obj of Array.from(this.objects)) {
      //if obj.type isnt 'door'
      for (let row = obj.y, end1 = (obj.y+obj.height)-1, asc1 = obj.y <= end1; asc1 ? row <= end1 : row >= end1; asc1 ? row++ : row--) {
        for (let col = obj.x, end2 = (obj.x+obj.width)-1, asc2 = obj.x <= end2; asc2 ? col <= end2 : col >= end2; asc2 ? col++ : col--) {
          const idx = (row * this.design.dimensions.width) + col
          //grid.set row, col, 0
          grid[idx] = 0
        }
      }
    }

    return grid
  }
}


module.exports = LevelGenerator

},{"./1d-intersect":1,"./aabb-expand":2,"./aabb-intersect":3,"./aabb-move":4,"./aabb-overlaps":5,"./aabb-portal":6,"./anteroom":7,"./build-graph":8,"./constants":9,"./design-default":10,"./door":11,"./level-furnish":19,"./qtree":32,"./random":35,"./room":36,"./roomie":37,"./tunneler":39,"./turn-90":40,"remove-array-items":23,"seedrandom":24}],19:[function(require,module,exports){
let furnish
const LootTable = require('loot-table')

const parse     = require('./parse-machine-config')


const machinesSrc = "//                                                       Padding----------    Spawn Probability---------   Volatility-----------------------------------------------------\n// Name               Theme    Width   Height  Rarity    Wall    Object      Room    Anteroom    Tunnel   Armor    InstabilityChance  InstabilityTimer   Explosion Radius\nParticle-Accelerator  RESEARCH    2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nElectrolysis-Chamber  RESEARCH    2      2      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nVacuum-Chamber        RESEARCH    2      2      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nCentrifuge            RESEARCH    2      2      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nMatter-Transference   RESEARCH    2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nMatter-Transport      RESEARCH    2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nParticle-Tunneler     RESEARCH    2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nMolecular-Assembler   RESEARCH    2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nStorage-Tanks         RESEARCH    2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nFlux-Coil             RESEARCH    2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nQuantum-Analysis      RESEARCH    2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nFluidic-Reduction     RESEARCH    2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nAnalysis-Node         RESEARCH    2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nMagnetic-Containment  RESEARCH    2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nNeutrino-Harvester    RESEARCH    2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nConveyer              FACTORY     2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nCombiner              FACTORY     2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nFabricator            FACTORY     2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nAligner               FACTORY     2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nTest-Runner           FACTORY     2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nPart-Duplicator       FACTORY     2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nSchematic-System      FACTORY     2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nAssembler             FACTORY     2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nMaterial-Transport    FACTORY     2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\nHardening-Chamber     FACTORY     2      3      0.95      3        2           60       30         10       10          0.88             1-8sec            2-4tiles\n"
const machines = parse(machinesSrc)

// place a series of machines in a given area, respecting machine padding rules
const layout = function(entity, machine, rotate) {
  let { width, height } = machine
  if (rotate == null) { rotate = false }
  if (rotate) {
    width = machine.height
    height = machine.width
  }

  const oneRow = []

  // determine how many rows and columns of machines fit in the given space
  //   start with a minimal wall padding
  //   repeat the pattern, with object padding between them
  //   stop when the room is full
  let x = entity.x + machine.padding.wall
  let y = entity.y + machine.padding.wall

  while (x < (entity.x + entity.width)) {
    if (oneRow.length > 0) {
      x += machine.padding.object
    }

    if (x < (entity.x + entity.width)) {
      oneRow.push({ name: machine.name, x, y, width, height, rotated: rotate })
      x += width
    }
  }

  if (!oneRow.length) { return [] }

  const columns = []
  while (y < (entity.y + entity.height)) {
    var nextRow
    if (columns.length > 0) {
      y += machine.padding.object
    }

    if (y < (entity.y + entity.height)) {
      nextRow = JSON.parse(JSON.stringify(oneRow))
      for (let m of Array.from(nextRow)) { m.y = y }
    }
    y += height

    columns.push(nextRow)
  }

  let results = []
  for (let c of Array.from(columns)) {
    results = results.concat(c)
  }
  // TODO: consider evenly distributing the spacing, or moving to one side of a room

  return results
}


const selectMachine = function(theme, entityType) {
  const selection = new LootTable()
  for (let name in machines) {
    const m = machines[name]
    if (m.theme === theme) {
      selection.add(name, m.rarity)
    }
  }

  const machineName = selection.choose()
  return machines[machineName]
}


module.exports = (furnish = function(objects, theme, options) {
  if (options == null) { options = {} }
  const compositions = new LootTable()
  compositions.add('empty', 15)
  compositions.add('machines', 75)
  compositions.add('machines_stockpile', 5)
  compositions.add('stockpile', 5)

  const allMachines = []

  for (let entity of Array.from(objects)) {
    if ((entity.type === 'room') || (entity.type === 'anteroom') || (entity.type === 'tunnel')) {
      const composition = compositions.choose()

      if ((composition === 'machines') || (composition === 'machines_stockpile')) {
        const machine = selectMachine(theme, entity.type)

        const result = layout(entity, machine)
        for (let m of Array.from(result)) { allMachines.push(m) }
      }
    }
  }

      // TODO: place stockpiles

  return allMachines
})

},{"./parse-machine-config":20,"loot-table":22}],20:[function(require,module,exports){
let parse
const optionalFloat = function(num) {
  if (num === '-') {
    return 0
  }
  return parseFloat(num) || num
}


const optionalInt = function(num) {
  if (num === '-') {
    return 0
  }
  return parseInt(num, 10)
}


const parseLine = function(line) {
  let machine
  line = line.trim()
  if ((line.length === 0) || (line.indexOf('//') === 0)) {
    return  // encountered comment
  }

  const tokens = line.match(/\S+/g)

  if (tokens.length !== 14) {
    console.error('invalid line:', line)
    return null
  }

  return machine = {
    name: tokens[0],
    theme: tokens[1],
    width: parseInt(tokens[2], 10),
    height: parseInt(tokens[3], 10),
    rarity: optionalFloat(tokens[4]),
    padding: {
      wall: optionalInt(tokens[5]),
      object: optionalInt(tokens[6])
    },
    spawnProbability: {
      room: optionalInt(tokens[7]),
      anteroom: optionalInt(tokens[8]),
      tunnel: optionalInt(tokens[9])
    },
    volatility: {
      armor: optionalInt(tokens[10]),
      instabilityChance: optionalInt(tokens[11]),
      instabilityTimer: optionalInt(tokens[12]),
      explosionRadius: optionalInt(tokens[13])
    }
  }
}


module.exports = (parse = function(inp) {
  const lines = inp.split('\n')
  const machines = {}
  for (let line of Array.from(lines)) {
    const machine = parseLine(line)
    if (machine) {
      machines[machine.name] = machine
    }
  }
  return machines
})

},{}],21:[function(require,module,exports){
let mutate
const random = require('./random')


// mutate an input number by a random value between -amount and amount
module.exports = (mutate = function(input, amount) {
  const output = (input - amount) + ( random.next() * ((2*amount)+1) )
  if (output < 0) {
    return 0
  }
  return output
})

},{"./random":35}],22:[function(require,module,exports){
/**
 * Copyright © 2015 John Watson
 * Licensed under the terms of the MIT License
 * ---
 * LootTable is used to make a random choice among a weighted list of alternatives
 * for item drops, map generation, and many other processes. Here's a good overview
 * of loot tables: http://www.lostgarden.com/2014/12/loot-drop-tables.html
 *
 * Example:
 *
 * var loot = new LootTable();
 * loot.add('sword', 20);
 * loot.add('shield', 5);
 * loot.add('gold', 5);
 * loot.add(null, 1);
 * var item = loot.choose(); // most likely a sword, sometimes null
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
  }
}(this, function () {

    var LootTable = function(table) {
        this.table = [];
        if (table !== undefined) this.table = table;
    };

    LootTable.prototype.constructor = LootTable;

    LootTable.prototype.clear = function() {
        this.table.length = 0;
    };

    /**
     * Add an item
     *
     * Weights are arbitrary, not percentages, and don't need to add up to 100.
     * If one item has a weight of 2 and another has a weight of 1, the first item
     * is twice as likely to be chosen. If quantity is given, then calls to choose()
     * will only return that item while some are available. Each choose() that
     * selects that item will reduce its quantity by 1.
     *
     * Item can be anything, not just strings. It could be an array, a number, JSON
     * data, null, a function... even another LootTable!
     * 
     * @param {mixed} item      The item to be chosen
     * @param {number} weight   (optional) The weight of the item, defaults to 1
     * @param {number} quantity (optional) Quantity available, defaults to Infinite
     */
    LootTable.prototype.add = function(item, weight, quantity) {
        if (weight === undefined || weight === null || weight <= 0) weight = 1;
        if (quantity === undefined || quantity === null || quantity <= 0) quantity = Number.POSITIVE_INFINITY;
        this.table.push({ item: item, weight: weight, quantity: quantity });
    };

    /**
     * Return a random item from the LootTable
     */
    LootTable.prototype.choose = function() {
        if (this.table.length === 0) return null;
        
        var i, v;
        var totalWeight = 0;
        for(i = 0; i < this.table.length; i++) {
            v = this.table[i];
            if (v.quantity > 0) {
                totalWeight += v.weight;
            }
        }

        var choice = 0;
        var randomNumber = Math.floor(Math.random() * totalWeight + 1);
        var weight = 0;
        for(i = 0; i < this.table.length; i++) {
            v = this.table[i];
            if (v.quantity <= 0) continue;

            weight += v.weight;
            if (randomNumber <= weight) {
                choice = i;
                break;
            }
        }

        var chosenItem = this.table[choice];
        this.table[choice].quantity--;

        return chosenItem.item;
    };

    return LootTable;
}));

},{}],23:[function(require,module,exports){
'use strict'

/**
 * Remove a range of items from an array
 *
 * @function removeItems
 * @param {Array<*>} arr The target array
 * @param {number} startIdx The index to begin removing from (inclusive)
 * @param {number} removeCount How many items to remove
 */
module.exports = function removeItems(arr, startIdx, removeCount)
{
  var i, length = arr.length

  if (startIdx >= length || removeCount === 0) {
    return
  }

  removeCount = (startIdx + removeCount > length ? length - startIdx : removeCount)

  var len = length - removeCount

  for (i = startIdx; i < len; ++i) {
    arr[i] = arr[i + removeCount]
  }

  arr.length = len
}

},{}],24:[function(require,module,exports){
// A library of seedable RNGs implemented in Javascript.
//
// Usage:
//
// var seedrandom = require('seedrandom');
// var random = seedrandom(1); // or any seed.
// var x = random();       // 0 <= x < 1.  Every bit is random.
// var x = random.quick(); // 0 <= x < 1.  32 bits of randomness.

// alea, a 53-bit multiply-with-carry generator by Johannes Baagøe.
// Period: ~2^116
// Reported to pass all BigCrush tests.
var alea = require('./lib/alea');

// xor128, a pure xor-shift generator by George Marsaglia.
// Period: 2^128-1.
// Reported to fail: MatrixRank and LinearComp.
var xor128 = require('./lib/xor128');

// xorwow, George Marsaglia's 160-bit xor-shift combined plus weyl.
// Period: 2^192-2^32
// Reported to fail: CollisionOver, SimpPoker, and LinearComp.
var xorwow = require('./lib/xorwow');

// xorshift7, by François Panneton and Pierre L'ecuyer, takes
// a different approach: it adds robustness by allowing more shifts
// than Marsaglia's original three.  It is a 7-shift generator
// with 256 bits, that passes BigCrush with no systmatic failures.
// Period 2^256-1.
// No systematic BigCrush failures reported.
var xorshift7 = require('./lib/xorshift7');

// xor4096, by Richard Brent, is a 4096-bit xor-shift with a
// very long period that also adds a Weyl generator. It also passes
// BigCrush with no systematic failures.  Its long period may
// be useful if you have many generators and need to avoid
// collisions.
// Period: 2^4128-2^32.
// No systematic BigCrush failures reported.
var xor4096 = require('./lib/xor4096');

// Tyche-i, by Samuel Neves and Filipe Araujo, is a bit-shifting random
// number generator derived from ChaCha, a modern stream cipher.
// https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf
// Period: ~2^127
// No systematic BigCrush failures reported.
var tychei = require('./lib/tychei');

// The original ARC4-based prng included in this library.
// Period: ~2^1600
var sr = require('./seedrandom');

sr.alea = alea;
sr.xor128 = xor128;
sr.xorwow = xorwow;
sr.xorshift7 = xorshift7;
sr.xor4096 = xor4096;
sr.tychei = tychei;

module.exports = sr;

},{"./lib/alea":25,"./lib/tychei":26,"./lib/xor128":27,"./lib/xor4096":28,"./lib/xorshift7":29,"./lib/xorwow":30,"./seedrandom":31}],25:[function(require,module,exports){
// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
// http://baagoe.com/en/RandomMusings/javascript/
// https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
// Original work is under MIT license -

// Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.



(function(global, module, define) {

function Alea(seed) {
  var me = this, mash = Mash();

  me.next = function() {
    var t = 2091639 * me.s0 + me.c * 2.3283064365386963e-10; // 2^-32
    me.s0 = me.s1;
    me.s1 = me.s2;
    return me.s2 = t - (me.c = t | 0);
  };

  // Apply the seeding algorithm from Baagoe.
  me.c = 1;
  me.s0 = mash(' ');
  me.s1 = mash(' ');
  me.s2 = mash(' ');
  me.s0 -= mash(seed);
  if (me.s0 < 0) { me.s0 += 1; }
  me.s1 -= mash(seed);
  if (me.s1 < 0) { me.s1 += 1; }
  me.s2 -= mash(seed);
  if (me.s2 < 0) { me.s2 += 1; }
  mash = null;
}

function copy(f, t) {
  t.c = f.c;
  t.s0 = f.s0;
  t.s1 = f.s1;
  t.s2 = f.s2;
  return t;
}

function impl(seed, opts) {
  var xg = new Alea(seed),
      state = opts && opts.state,
      prng = xg.next;
  prng.int32 = function() { return (xg.next() * 0x100000000) | 0; }
  prng.double = function() {
    return prng() + (prng() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
  };
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

function Mash() {
  var n = 0xefc8249d;

  var mash = function(data) {
    data = data.toString();
    for (var i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      var h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };

  return mash;
}


if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.alea = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],26:[function(require,module,exports){
// A Javascript implementaion of the "Tyche-i" prng algorithm by
// Samuel Neves and Filipe Araujo.
// See https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf

(function(global, module, define) {

function XorGen(seed) {
  var me = this, strseed = '';

  // Set up generator function.
  me.next = function() {
    var b = me.b, c = me.c, d = me.d, a = me.a;
    b = (b << 25) ^ (b >>> 7) ^ c;
    c = (c - d) | 0;
    d = (d << 24) ^ (d >>> 8) ^ a;
    a = (a - b) | 0;
    me.b = b = (b << 20) ^ (b >>> 12) ^ c;
    me.c = c = (c - d) | 0;
    me.d = (d << 16) ^ (c >>> 16) ^ a;
    return me.a = (a - b) | 0;
  };

  /* The following is non-inverted tyche, which has better internal
   * bit diffusion, but which is about 25% slower than tyche-i in JS.
  me.next = function() {
    var a = me.a, b = me.b, c = me.c, d = me.d;
    a = (me.a + me.b | 0) >>> 0;
    d = me.d ^ a; d = d << 16 ^ d >>> 16;
    c = me.c + d | 0;
    b = me.b ^ c; b = b << 12 ^ d >>> 20;
    me.a = a = a + b | 0;
    d = d ^ a; me.d = d = d << 8 ^ d >>> 24;
    me.c = c = c + d | 0;
    b = b ^ c;
    return me.b = (b << 7 ^ b >>> 25);
  }
  */

  me.a = 0;
  me.b = 0;
  me.c = 2654435769 | 0;
  me.d = 1367130551;

  if (seed === Math.floor(seed)) {
    // Integer seed.
    me.a = (seed / 0x100000000) | 0;
    me.b = seed | 0;
  } else {
    // String seed.
    strseed += seed;
  }

  // Mix in string seed, then discard an initial batch of 64 values.
  for (var k = 0; k < strseed.length + 20; k++) {
    me.b ^= strseed.charCodeAt(k) | 0;
    me.next();
  }
}

function copy(f, t) {
  t.a = f.a;
  t.b = f.b;
  t.c = f.c;
  t.d = f.d;
  return t;
};

function impl(seed, opts) {
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.tychei = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],27:[function(require,module,exports){
// A Javascript implementaion of the "xor128" prng algorithm by
// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

(function(global, module, define) {

function XorGen(seed) {
  var me = this, strseed = '';

  me.x = 0;
  me.y = 0;
  me.z = 0;
  me.w = 0;

  // Set up generator function.
  me.next = function() {
    var t = me.x ^ (me.x << 11);
    me.x = me.y;
    me.y = me.z;
    me.z = me.w;
    return me.w ^= (me.w >>> 19) ^ t ^ (t >>> 8);
  };

  if (seed === (seed | 0)) {
    // Integer seed.
    me.x = seed;
  } else {
    // String seed.
    strseed += seed;
  }

  // Mix in string seed, then discard an initial batch of 64 values.
  for (var k = 0; k < strseed.length + 64; k++) {
    me.x ^= strseed.charCodeAt(k) | 0;
    me.next();
  }
}

function copy(f, t) {
  t.x = f.x;
  t.y = f.y;
  t.z = f.z;
  t.w = f.w;
  return t;
}

function impl(seed, opts) {
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xor128 = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],28:[function(require,module,exports){
// A Javascript implementaion of Richard Brent's Xorgens xor4096 algorithm.
//
// This fast non-cryptographic random number generator is designed for
// use in Monte-Carlo algorithms. It combines a long-period xorshift
// generator with a Weyl generator, and it passes all common batteries
// of stasticial tests for randomness while consuming only a few nanoseconds
// for each prng generated.  For background on the generator, see Brent's
// paper: "Some long-period random number generators using shifts and xors."
// http://arxiv.org/pdf/1004.3115v1.pdf
//
// Usage:
//
// var xor4096 = require('xor4096');
// random = xor4096(1);                        // Seed with int32 or string.
// assert.equal(random(), 0.1520436450538547); // (0, 1) range, 53 bits.
// assert.equal(random.int32(), 1806534897);   // signed int32, 32 bits.
//
// For nonzero numeric keys, this impelementation provides a sequence
// identical to that by Brent's xorgens 3 implementaion in C.  This
// implementation also provides for initalizing the generator with
// string seeds, or for saving and restoring the state of the generator.
//
// On Chrome, this prng benchmarks about 2.1 times slower than
// Javascript's built-in Math.random().

(function(global, module, define) {

function XorGen(seed) {
  var me = this;

  // Set up generator function.
  me.next = function() {
    var w = me.w,
        X = me.X, i = me.i, t, v;
    // Update Weyl generator.
    me.w = w = (w + 0x61c88647) | 0;
    // Update xor generator.
    v = X[(i + 34) & 127];
    t = X[i = ((i + 1) & 127)];
    v ^= v << 13;
    t ^= t << 17;
    v ^= v >>> 15;
    t ^= t >>> 12;
    // Update Xor generator array state.
    v = X[i] = v ^ t;
    me.i = i;
    // Result is the combination.
    return (v + (w ^ (w >>> 16))) | 0;
  };

  function init(me, seed) {
    var t, v, i, j, w, X = [], limit = 128;
    if (seed === (seed | 0)) {
      // Numeric seeds initialize v, which is used to generates X.
      v = seed;
      seed = null;
    } else {
      // String seeds are mixed into v and X one character at a time.
      seed = seed + '\0';
      v = 0;
      limit = Math.max(limit, seed.length);
    }
    // Initialize circular array and weyl value.
    for (i = 0, j = -32; j < limit; ++j) {
      // Put the unicode characters into the array, and shuffle them.
      if (seed) v ^= seed.charCodeAt((j + 32) % seed.length);
      // After 32 shuffles, take v as the starting w value.
      if (j === 0) w = v;
      v ^= v << 10;
      v ^= v >>> 15;
      v ^= v << 4;
      v ^= v >>> 13;
      if (j >= 0) {
        w = (w + 0x61c88647) | 0;     // Weyl.
        t = (X[j & 127] ^= (v + w));  // Combine xor and weyl to init array.
        i = (0 == t) ? i + 1 : 0;     // Count zeroes.
      }
    }
    // We have detected all zeroes; make the key nonzero.
    if (i >= 128) {
      X[(seed && seed.length || 0) & 127] = -1;
    }
    // Run the generator 512 times to further mix the state before using it.
    // Factoring this as a function slows the main generator, so it is just
    // unrolled here.  The weyl generator is not advanced while warming up.
    i = 127;
    for (j = 4 * 128; j > 0; --j) {
      v = X[(i + 34) & 127];
      t = X[i = ((i + 1) & 127)];
      v ^= v << 13;
      t ^= t << 17;
      v ^= v >>> 15;
      t ^= t >>> 12;
      X[i] = v ^ t;
    }
    // Storing state as object members is faster than using closure variables.
    me.w = w;
    me.X = X;
    me.i = i;
  }

  init(me, seed);
}

function copy(f, t) {
  t.i = f.i;
  t.w = f.w;
  t.X = f.X.slice();
  return t;
};

function impl(seed, opts) {
  if (seed == null) seed = +(new Date);
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (state.X) copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xor4096 = impl;
}

})(
  this,                                     // window object or global
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);

},{}],29:[function(require,module,exports){
// A Javascript implementaion of the "xorshift7" algorithm by
// François Panneton and Pierre L'ecuyer:
// "On the Xorgshift Random Number Generators"
// http://saluc.engr.uconn.edu/refs/crypto/rng/panneton05onthexorshift.pdf

(function(global, module, define) {

function XorGen(seed) {
  var me = this;

  // Set up generator function.
  me.next = function() {
    // Update xor generator.
    var X = me.x, i = me.i, t, v, w;
    t = X[i]; t ^= (t >>> 7); v = t ^ (t << 24);
    t = X[(i + 1) & 7]; v ^= t ^ (t >>> 10);
    t = X[(i + 3) & 7]; v ^= t ^ (t >>> 3);
    t = X[(i + 4) & 7]; v ^= t ^ (t << 7);
    t = X[(i + 7) & 7]; t = t ^ (t << 13); v ^= t ^ (t << 9);
    X[i] = v;
    me.i = (i + 1) & 7;
    return v;
  };

  function init(me, seed) {
    var j, w, X = [];

    if (seed === (seed | 0)) {
      // Seed state array using a 32-bit integer.
      w = X[0] = seed;
    } else {
      // Seed state using a string.
      seed = '' + seed;
      for (j = 0; j < seed.length; ++j) {
        X[j & 7] = (X[j & 7] << 15) ^
            (seed.charCodeAt(j) + X[(j + 1) & 7] << 13);
      }
    }
    // Enforce an array length of 8, not all zeroes.
    while (X.length < 8) X.push(0);
    for (j = 0; j < 8 && X[j] === 0; ++j);
    if (j == 8) w = X[7] = -1; else w = X[j];

    me.x = X;
    me.i = 0;

    // Discard an initial 256 values.
    for (j = 256; j > 0; --j) {
      me.next();
    }
  }

  init(me, seed);
}

function copy(f, t) {
  t.x = f.x.slice();
  t.i = f.i;
  return t;
}

function impl(seed, opts) {
  if (seed == null) seed = +(new Date);
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (state.x) copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xorshift7 = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);


},{}],30:[function(require,module,exports){
// A Javascript implementaion of the "xorwow" prng algorithm by
// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

(function(global, module, define) {

function XorGen(seed) {
  var me = this, strseed = '';

  // Set up generator function.
  me.next = function() {
    var t = (me.x ^ (me.x >>> 2));
    me.x = me.y; me.y = me.z; me.z = me.w; me.w = me.v;
    return (me.d = (me.d + 362437 | 0)) +
       (me.v = (me.v ^ (me.v << 4)) ^ (t ^ (t << 1))) | 0;
  };

  me.x = 0;
  me.y = 0;
  me.z = 0;
  me.w = 0;
  me.v = 0;

  if (seed === (seed | 0)) {
    // Integer seed.
    me.x = seed;
  } else {
    // String seed.
    strseed += seed;
  }

  // Mix in string seed, then discard an initial batch of 64 values.
  for (var k = 0; k < strseed.length + 64; k++) {
    me.x ^= strseed.charCodeAt(k) | 0;
    if (k == strseed.length) {
      me.d = me.x << 10 ^ me.x >>> 4;
    }
    me.next();
  }
}

function copy(f, t) {
  t.x = f.x;
  t.y = f.y;
  t.z = f.z;
  t.w = f.w;
  t.v = f.v;
  t.d = f.d;
  return t;
}

function impl(seed, opts) {
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xorwow = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],31:[function(require,module,exports){
/*
Copyright 2014 David Bau.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

(function (pool, math) {
//
// The following constants are related to IEEE 754 limits.
//
var global = this,
    width = 256,        // each RC4 output is 0 <= x < 256
    chunks = 6,         // at least six RC4 outputs for each double
    digits = 52,        // there are 52 significant digits in a double
    rngname = 'random', // rngname: name for Math.random and Math.seedrandom
    startdenom = math.pow(width, chunks),
    significance = math.pow(2, digits),
    overflow = significance * 2,
    mask = width - 1,
    nodecrypto;         // node.js crypto module, initialized at the bottom.

//
// seedrandom()
// This is the seedrandom function described above.
//
function seedrandom(seed, options, callback) {
  var key = [];
  options = (options == true) ? { entropy: true } : (options || {});

  // Flatten the seed string or build one from local entropy if needed.
  var shortseed = mixkey(flatten(
    options.entropy ? [seed, tostring(pool)] :
    (seed == null) ? autoseed() : seed, 3), key);

  // Use the seed to initialize an ARC4 generator.
  var arc4 = new ARC4(key);

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.
  var prng = function() {
    var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
        d = startdenom,                 //   and denominator d = 2 ^ 48.
        x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  };

  prng.int32 = function() { return arc4.g(4) | 0; }
  prng.quick = function() { return arc4.g(4) / 0x100000000; }
  prng.double = prng;

  // Mix the randomness into accumulated entropy.
  mixkey(tostring(arc4.S), pool);

  // Calling convention: what to return as a function of prng, seed, is_math.
  return (options.pass || callback ||
      function(prng, seed, is_math_call, state) {
        if (state) {
          // Load the arc4 state from the given state if it has an S array.
          if (state.S) { copy(state, arc4); }
          // Only provide the .state method if requested via options.state.
          prng.state = function() { return copy(arc4, {}); }
        }

        // If called as a method of Math (Math.seedrandom()), mutate
        // Math.random because that is how seedrandom.js has worked since v1.0.
        if (is_math_call) { math[rngname] = prng; return seed; }

        // Otherwise, it is a newer calling convention, so return the
        // prng directly.
        else return prng;
      })(
  prng,
  shortseed,
  'global' in options ? options.global : (this == math),
  options.state);
}
math['seed' + rngname] = seedrandom;

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
function ARC4(key) {
  var t, keylen = key.length,
      me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) {
    s[i] = i++;
  }
  for (i = 0; i < width; i++) {
    s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
    s[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  (me.g = function(count) {
    // Using instance members instead of closure state nearly doubles speed.
    var t, r = 0,
        i = me.i, j = me.j, s = me.S;
    while (count--) {
      t = s[i = mask & (i + 1)];
      r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
    }
    me.i = i; me.j = j;
    return r;
    // For robust unpredictability, the function call below automatically
    // discards an initial batch of values.  This is called RC4-drop[256].
    // See http://google.com/search?q=rsa+fluhrer+response&btnI
  })(width);
}

//
// copy()
// Copies internal state of ARC4 to or from a plain object.
//
function copy(f, t) {
  t.i = f.i;
  t.j = f.j;
  t.S = f.S.slice();
  return t;
};

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
function flatten(obj, depth) {
  var result = [], typ = (typeof obj), prop;
  if (depth && typ == 'object') {
    for (prop in obj) {
      try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
    }
  }
  return (result.length ? result : typ == 'string' ? obj : obj + '\0');
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
function mixkey(seed, key) {
  var stringseed = seed + '', smear, j = 0;
  while (j < stringseed.length) {
    key[mask & j] =
      mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
  }
  return tostring(key);
}

//
// autoseed()
// Returns an object for autoseeding, using window.crypto and Node crypto
// module if available.
//
function autoseed() {
  try {
    var out;
    if (nodecrypto && (out = nodecrypto.randomBytes)) {
      // The use of 'out' to remember randomBytes makes tight minified code.
      out = out(width);
    } else {
      out = new Uint8Array(width);
      (global.crypto || global.msCrypto).getRandomValues(out);
    }
    return tostring(out);
  } catch (e) {
    var browser = global.navigator,
        plugins = browser && browser.plugins;
    return [+new Date, global, plugins, global.screen, tostring(pool)];
  }
}

//
// tostring()
// Converts an array of charcodes to a string
//
function tostring(a) {
  return String.fromCharCode.apply(0, a);
}

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to interfere with deterministic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
mixkey(math.random(), pool);

//
// Nodejs and AMD support: export the implementation as a module using
// either convention.
//
if ((typeof module) == 'object' && module.exports) {
  module.exports = seedrandom;
  // When in node.js, try using crypto package for autoseeding.
  try {
    nodecrypto = require('crypto');
  } catch (ex) {}
} else if ((typeof define) == 'function' && define.amd) {
  define(function() { return seedrandom; });
}

// End anonymous scope, and pass initial values.
})(
  [],     // pool: entropy pool starts empty
  Math    // math: package containing random, pow, and seedrandom
);

},{"crypto":13}],32:[function(require,module,exports){
'use strict'

const removeItems = require('remove-array-items')


/**
*
* simple-quadtree is a minimal quadtree implementation that supports simple put, get,
* remove and clear operations on objects having a x, y position and w, h dimension.
*
* Copyright (c) 2013 Antti Saarinen <antti.p.saarinen@gmail.com>
* https://github.com/asaarinen/qtree
*
*/

// MikeR: I've modified this implementation to use width and height, not w and h
function QuadTree(x, y, w, h, options) {

    var maxc = 25
    var leafratio = 0.5
    if( options ) {
        if( typeof options.maxchildren == 'number' )
            if( options.maxchildren > 0 )
                maxc = options.maxchildren
        if( typeof options.leafratio == 'number' )
            if( options.leafratio >= 0 )
                leafratio = options.leafratio
    }

    // test for deep equality for x,y,width,height
    function isequal(o1, o2) {
        if( o1.x == o2.x &&
            o1.y == o2.y &&
            o1.width == o2.width &&
            o1.height == o2.height )
            return true
        return false
    }

    // create a new quadtree node
    function createnode(x, y, w, h) {
        return {
            x: x,
            y: y,
            width: w,
            height: h,
            c: [],
            l: [],
            n: []
        }
    }

    // root node used by this quadtree
    var root = createnode(x, y, w, h)

    // calculate distance between two points
    function distance(x1, y1, x2, y2) {
        return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1))
    }

    // calculate distance between a point and a line (segment)
    function distancePL(x, y, x1, y1, dx1, dy1, len1 ) {
        if( !len1 ) // in case length is not provided, assume a line
            len1 = -1

        // x = x1 + s * dx1 + t * dy1
        // y = y1 + s * dy1 - t * dx1
        // x * dy1 - y * dx1 = x1 * dy1 - y1 * dx1 +
        //                     t * ( dy1 * dy1 + dx1 * dx1 )
        var t = dx1 * dx1 + dy1 * dy1
        if( t == 0 )
            return null
        else {
            t = ( x * dy1 - y * dx1 - x1 * dy1 + y1 * dx1 ) / t
            if( Math.abs(dx1) > Math.abs(dy1) )
                var s = ( x - x1 - t * dy1 ) / dx1
            else
                var s = ( y - y1 + t * dx1 ) / dy1
            if( ( s >= 0 && s <= len1 ) || len1 < 0 )
                return {
                    s: s,
                    t: t,
                    x: x1 + s * dx1,
                    y: y1 + s * dy1,
                    dist: Math.abs(t)
                }
            else if( s < 0 ) {
                var dist = distance(x, y, x1, y1)
                return {
                    s: s,
                    dist: dist
                }
            } else {
                var dist = distance(x, y,
                                    x1 + len1*dx1,
                                    y1 + len1*dy1)
                return {
                    s: s,
                    dist: dist
                }
            }
        }
    }

    // does a line and a rectangle overlap ?
    function overlap_line(o1, o2, buf) {
        if( !o1 || !o2 )
            return true
        var dist = distancePL(o2.x + 0.5 * o2.width,
                              o2.y + 0.5 * o2.height,
                              o1.x, o1.y, o1.dx, o1.dy, o1.dist)
        if( dist ) {
            dist.dist -= buf
            if( dist.dist < 0 )
                return true
            if( dist.dist * dist.dist <= o2.width * o2.width + o2.height * o2.height )
                return true
        }
        return false
    }

    // do two rectangles overlap ?
    function overlap_rect(o1, o2, buf) {
        if( !o1 || !o2 )
            return true
        if( o1.x + o1.width < o2.x - buf ||
            o1.y + o1.height < o2.y - buf ||
            o1.x - buf > o2.x + o2.width ||
            o1.y - buf > o2.y + o2.height )
            return false
        return true
    }

    function isleaf(node, obj) {

        var leaf = false
        if( obj.width * obj.height > node.width * node.height * leafratio )
            leaf = true

        if( obj.x < node.x ||
            obj.y < node.y ||
            obj.x + obj.width > node.x + node.width ||
            obj.y + obj.height > node.y + node.height )
            leaf = true

        var childnode = null
        for( var ni = 0; ni < node.n.length; ni++ )
            if( overlap_rect(obj, node.n[ni], 0) ) {
                if( childnode ) { // multiple hits
                    leaf = true
                    break
                } else
                    childnode = node.n[ni]
            }

        return { leaf: leaf,
                 childnode: childnode }
    }

    // put an object to one of the child nodes of this node
    function put_to_nodes(node, obj) {
        var leaf = isleaf(node, obj)
        if( leaf.leaf )
            node.l.push(obj)
        else if( leaf.childnode )
            put(leaf.childnode, obj)
        else
            return
    }

    function update_coords(obj, updatedcoords) {
        obj.x = ((typeof updatedcoords.x == 'number') ? updatedcoords.x : obj.x)
        obj.y = ((typeof updatedcoords.y == 'number') ? updatedcoords.y : obj.y)
        obj.width = ((typeof updatedcoords.width == 'number') ? updatedcoords.width : obj.width)
        obj.height = ((typeof updatedcoords.height == 'number') ? updatedcoords.height : obj.height)
    }

    function update(node, obj, attr, updatedcoords) {
        if( typeof attr == 'object' && typeof updatedcoords == 'undefined' ) {
            updatedcoords = attr
            attr = false
        }

        if( typeof updatedcoords == 'undefined' )
            return false

        if( !attr )
            attr = false
        else if( typeof attr != 'string' )
            attr = 'id'

        var count = 0
        for( var ci = 0; ci < node.c.length; ci++ )
            if( ( attr && node.c[ci][attr] == obj[attr] ) ||
                ( !attr && isequal(node.c[ci], obj) ) ) {

                // found the object to be updated
                var orig = node.c[ci]
                update_coords(orig, updatedcoords)

                if( orig.x > node.x + node.width ||
                    orig.y > node.y + node.height ||
                    orig.x + orig.width < node.x ||
                    orig.y + orig.height < node.y ) {

                    // this object needs to be removed and added
                    removeItems(node.c, ci, 1)
                    put(root, orig)
                } // updated object is still inside same node

                return true
            }

        for( var ci = 0; ci < node.l.length; ci++ )
            if( ( attr && node.l[ci][attr] == obj[attr] ) ||
                ( !attr && isequal(node.l[ci], obj) ) ) {

                var orig = node.l[ci]
                update_coords(orig, updatedcoords)

                // found the object to be updated
                if( orig.x > node.x + node.width ||
                    orig.y > node.y + node.height ||
                    orig.x + orig.width < node.x ||
                    orig.y + orig.height < node.y ) {

                    // this object needs to be removed and added
                    removeItems(node.l, ci, 1)
                    put(root, orig)
                } // updated object is still inside same node

                return true
            }

        var leaf = isleaf(node, obj)
        if( !leaf.leaf && leaf.childnode )
            if( update(leaf.childnode, obj, attr) )
                return true
        return false
    }

    // remove an object from this node
    function remove(node, obj, attr) {
        if( !attr )
            attr = false
        else if( typeof attr != 'string' )
            attr = 'id'

        var count = 0
        for( var ci = 0; ci < node.c.length; ci++ )
            if( ( attr && node.c[ci][attr] == obj[attr] ) ||
                ( !attr && isequal(node.c[ci], obj) ) ) {
                count++
                removeItems(node.c, ci, 1)
                ci--
            }

        for( var ci = 0; ci < node.l.length; ci++ )
            if( ( attr && node.l[ci][attr] == obj[attr] ) ||
                ( !attr && isequal(node.l[ci], obj) ) ) {
                count++
                removeItems(node.l, ci, 1)
                ci--
            }

        var leaf = isleaf(node, obj)
        if( !leaf.leaf && leaf.childnode )
            return count + remove(leaf.childnode, obj, attr)
        return count
    }

    // put an object to this node
    function put(node, obj) {

        if( node.n.length == 0 ) {
            node.c.push(obj)

            // subdivide
            if( node.c.length > maxc ) {
                var w2 = node.width / 2
                var h2 = node.height / 2
                node.n.push(createnode(node.x, node.y, w2, h2),
                            createnode(node.x + w2, node.y, w2, h2),
                            createnode(node.x, node.y + h2, w2, h2),
                            createnode(node.x + w2, node.y + h2, w2, h2))
                for( var ci = 0; ci < node.c.length; ci++ )
                    put_to_nodes(node, node.c[ci])
                node.c = []
            }
        } else
            put_to_nodes(node, obj)
    }

    // iterate through all objects in this node matching given overlap
    // function
    function getter(overlapfun, node, obj, buf, strict, callbackOrArray) {
        for( var li = 0; li < node.l.length; li++ )
            if( !strict || overlapfun(obj, node.l[li], buf) )
                if( typeof callbackOrArray == 'object' )
                    callbackOrArray.push(node.l[li])
                else if( !callbackOrArray(node.l[li]) )
                    return false
        for( var li = 0; li < node.c.length; li++ )
            if( !strict || overlapfun(obj, node.c[li], buf) )
                if( typeof callbackOrArray == 'object' )
                    callbackOrArray.push(node.c[li])
                else if( !callbackOrArray(node.c[li]) )
                    return false
        for( var ni = 0; ni < node.n.length; ni++ ) {
            if( overlapfun(obj, node.n[ni], buf) ) {
                if( typeof callbackOrArray == 'object' )
                    callbackOrArray.concat(getter(overlapfun, node.n[ni], obj, buf, strict, callbackOrArray))
                else if( !getter(overlapfun, node.n[ni], obj, buf, strict, callbackOrArray) )
                    return false
            }
        }
        return true
    }

    // iterate through all objects in this node matching the given rectangle
    function get_rect(node, obj, buf, callbackOrArray) {
        return getter(overlap_rect, node, obj, buf, true, callbackOrArray)
    }

    // iterate through all objects in this node matching the given
    // line (segment)
    function get_line(node, obj, buf, callbackOrArray) {
        return getter(overlap_line, node, obj, buf, false, callbackOrArray)
    }

    // iterate through all objects in this node matching given
    // geometry, either a rectangle or a line segment
    function get(node, obj, buf, callbackOrArray) {
        if( (typeof buf == 'function' || typeof buf == 'object') && typeof callbackOrArray == 'undefined' ) {
            callbackOrArray = buf
            buf = 0
        }
        if( typeof callbackOrArray == 'undefined' ) {
            callbackOrArray = []
            buf = 0
        }
        if( obj == null )
            get_rect(node, obj, buf, callbackOrArray)
        else if( typeof obj.x == 'number' &&
                 typeof obj.y == 'number' &&
                 !isNaN(obj.x) && !isNaN(obj.y) ) {
            if( typeof obj.dx == 'number' &&
                typeof obj.dy == 'number' &&
                !isNaN(obj.dx) && !isNaN(obj.dy) )
                get_line(node, obj, buf, callbackOrArray)
            else if( typeof obj.width == 'number' &&
                     typeof obj.height == 'number' &&
                     !isNaN(obj.width) && !isNaN(obj.height) )
                get_rect(node, obj, buf, callbackOrArray)
        }
        if( typeof callbackOrArray == 'object' )
            return callbackOrArray
    }

    // return the object interface
    return {
        get: function(obj, buf, callbackOrArray) {
            return get(root, obj, buf, callbackOrArray)
        },
        put: function(obj) {
            put(root, obj)
        },
        update: function(obj, attr, updatedcoords) {
            return update(root, obj, attr, updatedcoords)
        },
        remove: function(obj, attr) {
            return remove(root, obj, attr)
        },
        clear: function() {
            root = createnode(x, y, w, h)
        }
    }
}

// for use within node.js
if( typeof module != 'undefined' )
    module.exports = QuadTree

},{"remove-array-items":23}],33:[function(require,module,exports){
let turn90Random
const random = require('./random')


const dirs = {
  NORTH: [ 'EAST', 'WEST' ],
  SOUTH: [ 'EAST', 'WEST' ],
  EAST: [ 'NORTH', 'SOUTH' ],
  WEST: [ 'NORTH', 'SOUTH' ]
}

module.exports = (turn90Random = function(direction) {
  const val = Math.round(random.next())
  return dirs[direction][val]
})

},{"./random":35}],34:[function(require,module,exports){
let randomWeightedIndex
const random = require('./random')


// get a value from a range, based on probability
// e.g., here is a range, where the sum of all values must add up to 100 (%)
//      index =  0    1    2     3    4    5    6    7    8    9    10
// babyRoomie: [ 0,   0,   50,   50,  0,   0,   0,   0,   0,   0,   0 ]
// means a 50% chance the value will be 2, and 50% chance it will be 3

module.exports = (randomWeightedIndex = function(arr) {
  const diceRoll = random.next() * 100
  let idx = 0
  let summed = 0
  while (idx < arr.length) {
    summed += arr[idx]
    if (diceRoll < summed) {
      return idx
    }
    idx++
  }
  return 0
})

},{"./random":35}],35:[function(require,module,exports){
const seedrandom = require('seedrandom')


let rng = null

module.exports.seed = function(seedValue) {
  seedValue = seedValue || Math.random()
  console.log('random seed:', seedValue)
  return rng = seedrandom(seedValue)
}


module.exports.next = () => rng()

},{"seedrandom":24}],36:[function(require,module,exports){
class Room {
  constructor(init) {
    Object.assign(this, init)
    this.type = 'room'
    this.to = {}
  }


  // determine what edge of the room a door is on
  findExitDirection(door) {
    let direction
    if (door.x >= (this.x + this.width)) {
      direction = 'EAST'
    } else if (door.x <= this.x) {
      direction = 'WEST'
    } else if (door.y <= this.y) {
      direction = 'NORTH'
    } else {
      direction = 'SOUTH'
    }
    return direction
  }


  // returns true if the x,y coordinate lies outside of the room and at one of
  // the 4 corners
  isCornerPoint(x, y) {
    const leftX = this.x - 1
    const rightX = this.x + this.width
    const topY = this.y - 1
    const bottomY = this.y + this.height

    if ((x === leftX) && (y === topY)) {
      return true  // top left
    }
    if ((rightX === x) && (y === topY)) {
      return true  // top right
    }
    if ((leftX === x) && (bottomY === y)) {
      return true // bottom left
    }
    if ((rightX === x) && (bottomY === y)) {
      return true  // bottom right
    }
    return false
  }
}


module.exports = Room

},{}],37:[function(require,module,exports){
const Door        = require('./door')
const Room        = require('./room')
const randomIndex = require('./random-weighted-index')
const uuid        = require('./uuid')


class Roomie {
  // parent is the tunneler that spawned this roomie
  constructor(doorPosition, parentGeneration, direction, level, design, roomSize) {
    this.doorPosition = doorPosition
    this.direction = direction
    this.level = level
    this.design = design
    this.roomSize = roomSize
    this.generation = parentGeneration + randomIndex(this.design.babyRoomie)
    this.id = uuid()
  }


  step() {
    // only build the room if the level has capacity for more rooms of @roomSize
    if (this.level.roomCount[this.roomSize] >= this.design.maxRooms[this.roomSize]) {
      return false
    }

    const sizeRange = this.design.roomSizes[this.roomSize]
    const minSize = sizeRange[0]
    const maxSize = sizeRange[1]
    let r = this._getLargestBuildableRoom(minSize, maxSize, this.design.roomAspectRatio)
    if (r) {
      const d = new Door({ x: this.doorPosition.x, y: this.doorPosition.y, width: 1, height: 1, direction: this.direction })
      this.level.addEntity(d)
      r = new Room(r)
      this.level.addEntity(r)
      this.level.roomCount[this.roomSize]++
    }
    return false
  }


  // get dimensions of largest room with a door that fits within the size range, matches the
  // aspect ratio, and doesn't overlap existing level
  _getLargestBuildableRoom(minSize, maxSize, roomAspectRatio) {
    // determine the largest room that fits at the given level position
    const largestRoom = this.level.findLargestRoom(this.doorPosition, this.direction, maxSize)

    if (!largestRoom) {
      return null
    }

    if ((largestRoom.width / largestRoom.height) < roomAspectRatio) {
      console.log('couldnt build the room with the given aspect ratio. try use a smaller aspect ratio in the design file')
      return null
    }

    if ((largestRoom.height * largestRoom.width) >= minSize) {
      // we can build the room
      return largestRoom
    }

    // room is too small
    return null
  }
}


module.exports = Roomie

},{"./door":11,"./random-weighted-index":34,"./room":36,"./uuid":41}],38:[function(require,module,exports){
const Anteroom    = require('./anteroom')
const Door        = require('./door')
const Room        = require('./room')
const expandAABB  = require('./aabb-expand')
const overlaps    = require('./aabb-overlaps')
const removeItems = require('remove-array-items')


class Tunnel {
  // we store the parent tunnel that this tunnel was generated from because it
  // will interfere when checking for overlap later if we don't ignore it.
  constructor(level, parentTunnel) {
    this.level = level
    this.parentTunnel = parentTunnel
    this.type = 'tunnel'
    this.to = {}
    this.direction = null
  }


  // returns final excavation state for the tunnel
  // ROOM | TUNNEL | ANTEROOM | DOOR  tunneled into an existing open space
  // CLOSED                    fully excavated tunnel, ending on closed space
  // DUNGEON-OVERLAP           can't excavate; outside the level bounds
  // PREFAB-OVERLAP            can't excavate: overlapping room prefab
  // ROOM-CORNER-OVERLAP       can't excavate: touches a room corner tile
  excavate(startPosition, direction, stepLength, tunnelWidth) {

    this.direction = direction
    this.tunnelWidth = tunnelWidth
    const radius = (this.tunnelWidth - 1) / 2
    if (this.direction === 'EAST') {
      Object.assign(this, { x: startPosition.x+1, y: startPosition.y-radius, width: 0, height: this.tunnelWidth })
    } else if (this.direction === 'WEST') {
      Object.assign(this, { x: startPosition.x, y: startPosition.y-radius, width: 0, height: this.tunnelWidth })
    } else if (this.direction === 'NORTH') {
      Object.assign(this, { x: startPosition.x-radius, y: startPosition.y, width: this.tunnelWidth, height: 0 })
    } else {
      Object.assign(this, { x: startPosition.x-radius, y: startPosition.y+1, width: this.tunnelWidth, height: 0 })
    }

    const minRoomSpacing = 1
    const minAnteroomSpacing = 0
    const minTunnelSpacing = 0
    let step = 0

    const ignore = this.parentTunnel
    while (step < stepLength) {
      const survey = expandAABB(this, this.direction, 1)
      if (!this.level.contains(survey)) {
        return 'DUNGEON-OVERLAP'
      }

      const entity = this.level.overlaps(survey, minRoomSpacing, minAnteroomSpacing, minTunnelSpacing, ignore)

      if (entity) {
        if (entity.prefab) {
          return 'PREFAB-OVERLAP'
        }
        if (entity.type === 'room') {
          // tunnels can't overlap with room corners
          if (this._atRoomCorner(entity)) {
            return 'ROOM-CORNER-OVERLAP'
          }

          // only create a door if the tunnel was excavated at all
          if ((this.width > 0) && (this.height > 0)) {
            var doorPosition = this._getDoorPosition(entity, this.direction)
            if (doorPosition) {
              // prohibit door placement when adjacent to any existing door
              const overlappingDoors = this.level.objects.filter(o => (o.type === 'door') && overlaps(doorPosition, o))
              if (overlappingDoors.length === 0) {
                const d = new Door(doorPosition)

                d.direction = this.direction
                this.level.addEntity(d)
              }
            }
          }
        }

        return entity.type.toUpperCase()
      }

      Object.assign(this, survey)
      step++
    }
    return 'CLOSED'
  }


  // given a direction get the tunnel's end position, where the tunneler would
  // be after excavating
  getEndPosition() {
    const radius = (this.tunnelWidth - 1) / 2
    if (this.direction === 'NORTH') {
      return { x: this.x + radius, y: this.y }
    } else if (this.direction === 'SOUTH') {
      return { x: this.x + radius, y: (this.y + this.height) - 1 }
    } else if (this.direction === 'EAST') {
      return { x: (this.x + this.width) - 1, y: this.y + radius }
    } else if (this.direction === 'WEST') {
      return { x: this.x, y: this.y + radius }
    }
    return null
  }


  // given a position in the tunnel and a direction, provide the position at the
  // edge of the tunnel
  getExit(position, direction) {
    const pos = {x: position.x, y: position.y}
    if (direction === 'NORTH') {
      pos.y = this.y - 1
    } else if (direction === 'SOUTH') {
      pos.y = this.y + this.height
    } else if (direction === 'WEST') {
      pos.x = this.x - 1
    } else {
      pos.x = this.x + this.width
    }
    return pos
  }


  // returns true if any of the tunnel corners touch any room corners
  _atRoomCorner(room) {
    if (room.isCornerPoint(this.x, this.y)) {
      return true
    }
    if (room.isCornerPoint((this.x+this.width)-1, this.y)) {
      return true
    }
    if (room.isCornerPoint(this.x, (this.y+this.height)-1)) {
      return true
    }
    if (room.isCornerPoint((this.x+this.width)-1, (this.y+this.height)-1)) {
      return true
    }
    return false
  }


  // find all 1 unit squares along a tunnel's edge (useful for door placement)
  _findSquares(tunnelDirection) {
    let x, y
    const result = []
    if (tunnelDirection === 'NORTH') {
      for (({ x } = this), end = (this.x+this.tunnelWidth)-1, asc = this.x <= end; asc ? x <= end : x >= end; asc ? x++ : x--) {
        var asc, end
      result.push({ x, y: this.y-1, width: 1, height: 1 }) }
    } else if (tunnelDirection === 'SOUTH') {
      for (({ x } = this), end1 = (this.x+this.tunnelWidth)-1, asc1 = this.x <= end1; asc1 ? x <= end1 : x >= end1; asc1 ? x++ : x--) { var asc1, end1;
      result.push({ x, y: this.y+this.height, width: 1, height: 1 }) }
    } else if (tunnelDirection === 'EAST') {
      for (({ y } = this), end2 = (this.y+this.tunnelWidth)-1, asc2 = this.y <= end2; asc2 ? y <= end2 : y >= end2; asc2 ? y++ : y--) { var asc2, end2;
      result.push({x: this.x+this.width, y, width: 1, height: 1 }) }
    } else {
      for (({ y } = this), end3 = (this.y+this.tunnelWidth)-1, asc3 = this.y <= end3; asc3 ? y <= end3 : y >= end3; asc3 ? y++ : y--) { var asc3, end3;
      result.push({x: this.x-1, y, width: 1, height: 1 }) }
    }
    return result
  }


  // find the location near the tunnelEndpoint to build the room door. (ideally centered in tunnel)
  _getDoorPosition(room, tunnelDirection) {
    // find all squares along the tunnel edge to potentially place a door at
    const squares = this._findSquares(tunnelDirection)

    // prefer to center the door in tunnel if possible, so move the square that
    // represents tunnel center point to the front of the list to check
    const centerIdx = Math.floor(this.tunnelWidth/2)
    const center = squares[centerIdx]
    removeItems(squares, centerIdx, 1)
    squares.unshift(center)

    for (let square of Array.from(squares)) {
      const doorTouchesRoom = overlaps(room, square)
      if (doorTouchesRoom && (!room.isCornerPoint(square.x, square.y))) {
        square.width = 1
        square.height = 1
        return square
      }
    }
    return null
  }
}


module.exports = Tunnel

},{"./aabb-expand":2,"./aabb-overlaps":5,"./anteroom":7,"./door":11,"./room":36,"remove-array-items":23}],39:[function(require,module,exports){
const Anteroom     = require('./anteroom')
const Roomie       = require('./roomie')
const Tunnel       = require('./tunnel')
const getValue     = require('./getvalue')
const moveAABB     = require('./aabb-move')
const mutate       = require('./mutate')
const overlaps     = require('./aabb-overlaps')
const random       = require('./random')
const randomIndex  = require('./random-weighted-index')
const turn90       = require('./turn-90')
const turn90Random = require('./random-turn-90')
const uuid         = require('./uuid')


// constants
const DEAD = false
const ALIVE = true

class Tunneler {
  constructor(level, design, init) {
    this.level = level
    this.design = design
    Object.assign(this, init)
    this.steps = 0
    this.id = uuid()
  }


  // returns true if the tunneler is alive
  step() {
    // tunneler has expired
    let changeDir, direction
    if (this.steps >= this.maxSteps) {
      // tunnelers that end without hitting anything have a chance to spawn a room
      const diceRoll = random.next() * 100
      if (diceRoll < this.joinProb) {
        const roomSize = this._getRoomSizeExcavation()
        changeDir = random.next() * 100
        if (changeDir <= this.changeDirectionProb) {
          direction = turn90Random(this.direction)
        } else {
          ({ direction } = this)
        }

        const r = new Roomie(this, this.generation, direction, this.level, this.design, roomSize)
        this.level.workers.push(r)
      }

      return DEAD
    }

    this.steps++

    const t = new Tunnel(this.level, this.parentTunnel)

    let pos = this._getNewTunnelerPosition(this.parentTunnel, this.tunnelWidth, this.direction)
    const state = t.excavate(pos, this.direction, this.stepLength, this.tunnelWidth)

    if ([ 'DUNGEON-OVERLAP', 'PREFAB-OVERLAP', 'ROOM-CORNER-OVERLAP' ].indexOf(state) >= 0) {
      // don't allow last chance tunnelers that fail to spawn again. Otherwise, we get into
      // infinite loop situations. for example, when a tunneler that creates a wide tunnel hits the
      // level edge and can't turn or do anything.
      if (!this.isLastChanceTunneler) {
        this._spawnLastChanceTunneler()
      }

      return DEAD
    }

     // if the tunnel has height and width, it was (at least partially)
    // excavated, so add it to the level
    if (t.width && t.height) {
      this.level.addEntity(t)
      this.parentTunnel = t // update the new parent tunnel for dis shiz
    }

    if ([ 'ANTEROOM', 'ROOM', 'TUNNEL', 'DOOR' ].indexOf(state) >= 0) {
      return DEAD
    }

    // update tunneler's position to the end of the excavated tunnel
    // at this point, state must be CLOSED (the tunnel fully excavated without hitting any open space)
    const tunnelEndpos = t.getEndPosition()
    this.x = tunnelEndpos.x
    this.y = tunnelEndpos.y

    // TODO: since the last chance tunneler succeeded (fully excavated,) mark it as no longer a last chance?
    //@isLastChanceTunneler = false

    let changedDirection = false
    let anteroom = null
    this.lastDirection = this.direction
    let babies = []

    changeDir = random.next() * 100
    if (changeDir <= this.changeDirectionProb) {
      this.direction = turn90Random(this.direction)
      changedDirection = true
      babies = this._spawnTunnelers(this.turnDoubleSpawnProb, t)
    } else {
      babies = this._spawnTunnelers(this.straightDoubleSpawnProb, t)
    }

    if (changedDirection || babies.length) {
      const probability = getValue(this.design.anteroomProbability, this.tunnelWidth)
      anteroom = this._spawnAnteroom(probability, t)
    }

    if (anteroom) {
      // move the tunneler to an anteroom exit based on direction and anteroom size
      const newPos = anteroom.getCenteredExit(this.direction)
      this.x = newPos.x
      this.y = newPos.y
      this.level.addEntity(anteroom)

      /*
      * reduce the newly created tunnel's dimensions to not overlap with the new anteroom
      if t.direction is 'EAST'
        amount = Math.ceil(anteroom.width / 2)
        t.width -= amount
      if t.direction is 'WEST'
        amount = Math.ceil(anteroom.width / 2)
        t.x += amount
        t.width -= amount
      if t.direction is 'NORTH'
        amount = Math.ceil(anteroom.height / 2)
        t.height -= amount
        t.y += amount
      if t.direction is 'SOUTH'
        amount = Math.ceil(anteroom.height / 2)
        t.height -= amount
      */
    }

    for (let baby of Array.from(babies)) {
      // if an anteroom was created move the baby tunnelers to the anteroom's
      // exit in the direction of the baby tunnelers future excavation
      if (anteroom) {
        pos = anteroom.getCenteredExit(baby.direction)
        baby.x = pos.x
        baby.y = pos.y
      }
      this.level.workers.push(baby)
    }

    if (changedDirection) {
      pos = this._getNewTunnelerPosition(t, this.tunnelWidth, this.direction)
      this.x = pos.x
      this.y = pos.y
    }

    this._addRoomies(t, changedDirection, anteroom)
    return ALIVE
  }


  _addRoomies(t, changedDirection, anteroom) {
    let r, roomSize
    let roomie_directions = []
    const roomie_positions = []

    if (changedDirection) {
      roomie_directions = this._getUnusedDirections()
    } else {
      roomie_directions = [ turn90(this.lastDirection, 'LEFT'), turn90(this.lastDirection, 'RIGHT') ]
    }

    if (anteroom) {
      roomie_positions.push(anteroom.getCenteredDoor(roomie_directions[0]))
      roomie_positions.push(anteroom.getCenteredDoor(roomie_directions[1]))
    } else {
      roomie_positions.push(t.getExit({ x: this.x, y: this.y }, roomie_directions[0]))
      roomie_positions.push(t.getExit({ x: this.x, y: this.y }, roomie_directions[1]))
    }

    if ((random.next() * 100) < this.makeRoomsLeftProb) {
      roomSize = this._getRoomSizeExcavation(changedDirection)
      r = new Roomie(roomie_positions[0], this.generation, roomie_directions[0], this.level, this.design, roomSize)
      this.level.workers.push(r)
    }

    if ((random.next() * 100) < this.makeRoomsRightProb) {
      roomSize = this._getRoomSizeExcavation(changedDirection)
      r = new Roomie(roomie_positions[1], this.generation, roomie_directions[1], this.level, this.design, roomSize)
      return this.level.workers.push(r)
    }
  }


  // determine room size to excavate
  _getRoomSizeExcavation(branching) {
    let probabilities
    if (branching) {
      probabilities = getValue(this.design.roomSizeProbability.branching, this.tunnelWidth)
    } else {
      probabilities = getValue(this.design.roomSizeProbability.sideways, this.tunnelWidth)
    }

    let summed = 0
    const diceRoll = random.next() * 100
    for (let size in probabilities) {
      const prob = probabilities[size]
      summed += prob
      if (diceRoll < summed) {
        return size
      }
    }
    return null
  }


  _getOppositeDirection(direction) {
    const oppositeDirections = {
      NORTH: 'SOUTH',
      EAST: 'WEST',
      WEST: 'EAST',
      SOUTH: 'NORTH'
    }
    return oppositeDirections[direction]
  }


  _getUnusedDirections() {
    const dirs = {NORTH: true, SOUTH: true, EAST: true, WEST: true}

    // get the opposite direction we last came from.
    // for example if a tunnel direction is EAST, and we
    // want to avoid hitting that tunnel we need to not
    // travel WEST in order to avoid hitting that tunnel.
    let opposite = this._getOppositeDirection(this.direction)
    delete dirs[opposite]

    // TODO: need to revisit this. not sure how @lastDirection is set.
    if (!this.lastDirection) {
      this.lastDirection = this.parentTunnel.direction
    }

    opposite = this._getOppositeDirection(this.lastDirection)
    delete dirs[opposite]

    return Object.keys(dirs)
  }


  _spawnAnteroom(probability, parentTunnel) {
    const diceRoll = random.next() * 100
    if (diceRoll < probability) {
      // determine anteroom center position
      let centerX = this.x
      let centerY = this.y
      const roomRadius = parentTunnel.tunnelWidth + 2
      if (parentTunnel.direction === 'EAST') {
        centerX += roomRadius
      }
      if (parentTunnel.direction === 'WEST') {
        centerX -= roomRadius
      }
      if (parentTunnel.direction === 'NORTH') {
        centerY -= roomRadius
      }
      if (parentTunnel.direction === 'SOUTH') {
        centerY += roomRadius
      }

      const anteroom = new Anteroom(centerX, centerY, parentTunnel.tunnelWidth)
      if (anteroom.isValid(this.level, parentTunnel)) {
        return anteroom
      }
    }

    return null
  }


  _spawnLastChanceTunneler() {
    // get a random direction that isnt @direction or @lastDirection
    const directions = this._getUnusedDirections()
    const randomDirection = directions[Math.floor(random.next() * directions.length)]

    const init = {
      x: this.x,
      y: this.y,
      isLastChanceTunneler: true,
      direction: randomDirection,
      generation: this.generation,
      stepLength: this.stepLength,
      maxSteps: getValue(this.design.tunnelerMaxSteps, this.generation),
      tunnelWidth: this.tunnelWidth,
      parentTunnel: this.parentTunnel
    }

    Object.assign(init, this.design.lastChanceTunneler)

    const t = new Tunneler(this.level, this.design, init)

    return this.level.workers.push(t)
  }


  _spawnTunneler(parentTunnel, direction) {
    let t
    const size = random.next() * 100
    let { tunnelWidth } = this

    // tunnel widths should always be odd and > 0
    if (size < getValue(this.design.babyTunnelers.sizeUpProbability, this.generation+1)) {
      tunnelWidth += 2
    } else if (size < getValue(this.design.babyTunnelers.sizeDownProbability, this.generation+1)) {
      if (tunnelWidth > 2) {
        tunnelWidth -= 2
      }
    }

    // position the tunneler if the tunnel width has changed
    const pos = this._getNewTunnelerPosition(parentTunnel, tunnelWidth, direction)

    const init = {
      x: pos.x,
      y: pos.y,
      direction,
      generation: this.generation + randomIndex(this.design.babyTunnelers.generationBirthProbability),
      stepLength: this.stepLength,
      tunnelWidth,
      straightDoubleSpawnProb: Math.round(mutate(this.straightDoubleSpawnProb, this.design.mutator)),
      turnDoubleSpawnProb: Math.round(mutate(this.turnDoubleSpawnProb, this.design.mutator)),
      changeDirectionProb: Math.round(mutate(this.changeDirectionProb, this.design.mutator)),
      makeRoomsRightProb: Math.round(mutate(this.makeRoomsRightProb, this.design.mutator)),
      makeRoomsLeftProb: Math.round(mutate(this.makeRoomsLeftProb, this.design.mutator)),
      joinProb: getValue(this.design.babyTunnelers.joinProbability, this.generation+1),
      parentTunnel
    }

    init.maxSteps = getValue(this.design.tunnelerMaxSteps, init.generation)

    return t = new Tunneler(this.level, this.design, init)
  }


  _spawnTunnelers(probability, parentTunnel, count) {
    if (count == null) { count = 2 }
    const babies = []
    const directions = this._getUnusedDirections()
    for (let i = 1, end = count, asc = 1 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
      const diceRoll = random.next() * 100
      if (diceRoll < probability) {
        const nextDirection = directions.pop()
        babies.push(this._spawnTunneler(parentTunnel, nextDirection))
      }
    }
    return babies
  }


  _isATurn(directionA, directionB) {
    if ((directionA === 'NORTH') || (directionA === 'SOUTH')) {
      if ((directionB === 'NORTH') || (directionB === 'SOUTH')) {
        return false
      }
    }

    if ((directionA === 'EAST') || (directionA === 'WEST')) {
      if ((directionB === 'EAST') || (directionB === 'WEST')) {
        return false
      }
    }

    return true
  }


  // if a tunneler changes directions, calculate the correct starting position
  // that will avoid creating overlap with the previous (parent) tunnel and
  // prevent artifacts at tunnel corners
  _getNewTunnelerPosition(parentTunnel, newTunnelWidth, newTunnelDirection) {
    const pos = {x: this.x, y: this.y}

    // if there's no parent tunnel, no need to change tunneler position
    if (!parentTunnel) { return pos }

    // same travel direction for both tunnels, current position is fine
    if (parentTunnel.direction === newTunnelDirection) {
      // return the position at the edge of the parent tunnel to avoid overlapping with parent
      if (newTunnelDirection === 'SOUTH') {
        pos.y = (parentTunnel.y + parentTunnel.height) - 1
      }
      if (newTunnelDirection === 'NORTH') {
        pos.y = parentTunnel.y
      }
      if (newTunnelDirection === 'EAST') {
        pos.x = (parentTunnel.x + parentTunnel.width) - 1
      }
      if (newTunnelDirection === 'WEST') {
        pos.x = parentTunnel.x
      }
      return pos
    }

    // if traveling east-west or north-south no need to move to the side
    if (this._isATurn(parentTunnel.direction, newTunnelDirection)) {
      const sideDistance = (newTunnelWidth - 1) / 2

      if (sideDistance > 0) {
        if (parentTunnel.direction === 'EAST') {
          pos.x -= sideDistance
        }
        if (parentTunnel.direction === 'WEST') {
          pos.x += sideDistance
        }
        if (parentTunnel.direction === 'NORTH') {
          pos.y += sideDistance
        }
        if (parentTunnel.direction === 'SOUTH') {
          pos.y -= sideDistance
        }
      }
    }

    // in tunnels > 1 unit wide, we need to move the tunneler to the side of the
    // tunnel to avoid overlapping the old tunnel
    const forwardDistance = (parentTunnel.tunnelWidth - 1) / 2

    if (forwardDistance > 0) {
      if (newTunnelDirection === 'NORTH') {
        //pos.y -= forwardDistance
        pos.y = parentTunnel.y
      }
      if (newTunnelDirection === 'SOUTH') {
        //pos.y += forwardDistance
        pos.y = (parentTunnel.y + parentTunnel.height) - 1
      }
      if (newTunnelDirection === 'EAST') {
        //pos.x += forwardDistance
        pos.x = (parentTunnel.x + parentTunnel.width) - 1
      }
      if (newTunnelDirection === 'WEST') {
        //pos.x -= forwardDistance
        pos.x = parentTunnel.x
      }
    }

    // TODO: verify that we didn't backtrack outside of the bounds of the original tunnel
    //       seems unlikely would require a very short old tunnel and/or a very wide new tunnel
    return pos
  }
}


module.exports = Tunneler

},{"./aabb-move":4,"./aabb-overlaps":5,"./anteroom":7,"./getvalue":17,"./mutate":21,"./random":35,"./random-turn-90":33,"./random-weighted-index":34,"./roomie":37,"./tunnel":38,"./turn-90":40,"./uuid":41}],40:[function(require,module,exports){
// given a heading direction and a turn direction, return the new heading
// e.g.,  result = turn 'NORTH', 'LEFT'
//        result will be 'WEST', because you are heading north then turn left 90 degrees

let turn90
const leftDirections = {
  EAST: 'NORTH',
  WEST: 'SOUTH',
  NORTH: 'WEST',
  SOUTH: 'EAST'
}
const rightDirections = {
  EAST: 'SOUTH',
  WEST: 'NORTH',
  NORTH: 'EAST',
  SOUTH: 'WEST'
}

module.exports = (turn90 = function(headingDirection, relativeDirection) {
  if ((relativeDirection === 'LEFT') || (relativeDirection === 'COUNTERCLOCKWISE')) {
    return leftDirections[headingDirection]
  } else if ((relativeDirection === 'RIGHT') || (relativeDirection === 'CLOCKWISE')) {
    return rightDirections[headingDirection]
  }
  return null
})

},{}],41:[function(require,module,exports){

let next
let uuid = 0

module.exports = (next = () => uuid++)

},{}]},{},[12]);
