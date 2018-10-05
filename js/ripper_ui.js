
    /* 
     * This defines the UI object, which is drawn in a HTML5 canvas element.
     * 
     * The ripper UI object is essentially a blank rectangular field with a crosshair you can drag around.
     * You can click on the crosshair lines to indicate rip cuts to make.  Any combination of quadrant lines
     * can be selected, and the selection is returned as a list of quadrants, numbered 1-4
     *
     * You must define the element in your HTML, and pass it to this object's constructor.
     * You may also pass an object that describes the following additional options:
     *   w - The actual width of the canvas area (real units)
     *   h - The actual height of the canvas area (real units)
     */
    function TableRipperUI(element, options) {
      this.cvs = element;
      options = options || {};
      this.w = options.w || 96.0;
      this.h = options.h || 48.0;
      var bgcolor = options.bgcolor || ['#dddddd','#ffffff'];
      if(Array.isArray(bgcolor)) {
        this.bgcolor = bgcolor;
      } else {
        this.bgcolor = [bgcolor, bgcolor];
      }
      this.x = this.w/2;
      this.y = this.h/2;
      this.aspect = this.h/this.w;
      this.hilight_quadrant = 0;
      this.quads = new Set();
      this.dragCoordinates = null;
      this.cvs.addEventListener('touchstart',this.onMouseDown.bind(this), false);
      this.cvs.addEventListener('touchend',this.onMouseUp.bind(this), false);
      this.cvs.addEventListener('touchcancel',this.onMouseUp.bind(this), false);
      this.cvs.addEventListener('touchmove',this.onMouseMove.bind(this), false);

      this.cvs.addEventListener('mousedown',this.onMouseDown.bind(this), false);
      this.cvs.addEventListener('mouseup',this.onMouseUp.bind(this), false);
      this.cvs.addEventListener('mouseleave',this.onMouseLeave.bind(this), false);
      this.cvs.addEventListener('mousemove',this.onMouseMove.bind(this), false);
     
      this.listeners = {
        'change' : []
      };
    }
    
    /* 
     * Bind the provided listener to the event.  
     * Currently these are the eventsb
     *   - change : Fired whenever there is a change in the state of the UI, precipitated by the user
     */
    TableRipperUI.prototype.on = function(evt, listener) {
      if(evt in this.listeners) {
        this.listeners[evt].push(listener);
      }
    }

    /*
     * Toggle the quadrant line specified. (1-4)
     */
    TableRipperUI.prototype.toggleQuad = function(quad) {
      if(this.quads.has(quad)) {
        this.quads.delete(quad);
      } else {
        this.quads.add(quad);
      }
      this.emit('change', {x:this.x,y:this.y, quads: Array.from(this.quads)});
    }


    /*
     * Size this element to match the dimensions of its parent, and redraw.
     * TODO RESIZE ISSUE ON IPHONE
     */
    TableRipperUI.prototype.resize = function() {
      var w = (this.cvs.parentElement.offsetWidth)-20;
      var h = (w*this.aspect)
      cvs.style.width = w + 'px';
      cvs.style.height = h + 'px';
      cvs.width = w;
      cvs.height = h;
      this.scale = w / this.w
      this.draw();
    }

    /*
     * Draw the UI element to the canvas
     */
    TableRipperUI.prototype.draw = function() {
      var ctx = this.cvs.getContext('2d');

      // Gradient
      var grd=ctx.createLinearGradient(0,0,0,this.h*this.scale);
      grd.addColorStop(0,this.bgcolor[0]);
      grd.addColorStop(1,this.bgcolor[1]);
      ctx.fillStyle=grd;
      ctx.fillRect(0,0,this.w*this.scale, this.h*this.scale);

      // Crosshair
      ctx.strokeStyle = 'gray'
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, this.scale*(this.h-this.y));
      ctx.lineTo(this.scale*this.w, this.scale*(this.h-this.y));
      ctx.moveTo(this.scale*this.x, 0);
      ctx.lineTo(this.scale*this.x, this.scale*this.h);
      ctx.stroke();

      // Middle circle
      ctx.beginPath();
      ctx.arc(this.scale*this.x, this.scale*(this.h-this.y), 10, 0, 2*Math.PI);
      ctx.stroke();

      // Active cuts
      this.quads.forEach(function(quad) {
        this.drawQuadLine(ctx, quad, 'red', 2);
      }.bind(this));

      // Hover quad line and center circle
      this.drawQuadLine(ctx, this.hilight_quadrant, 'blue', 3);
      if(this.hilight_quadrant === 5) {
        ctx.strokeStyle = 'blue'
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.scale*this.x, this.scale*(this.h-this.y), 10, 0, 2*Math.PI);
        ctx.stroke();      
      } 

      // Coordinates
      this.drawCoordinates(ctx)
    }

    /*
     * Draws the coordinates of the crosshair.
     * This function draws the coordinates near the crosshair in the quadrant
     * that has the most room.
     */
    TableRipperUI.prototype.drawCoordinates = function(ctx) {
      var OFFSET = 10;
      if(this.x <= this.w/2.0) {
        ctx.textAlign = 'left';
        var x = this.scale*this.x + OFFSET;
      } else {
        ctx.textAlign = 'right';
        var x = this.scale*this.x - OFFSET;
      }
      if(this.y >= this.h/2.0) {
        ctx.textBaseline = 'top'
        var y = this.scale*(this.h-this.y) + OFFSET;
      } else {
        ctx.textBaseline = 'bottom'
        var y = this.scale*(this.h-this.y) - OFFSET;
      }
      ctx.fillStyle = 'gray';
      ctx.font = "1.25em monospace";
      ctx.fillText("(" + this.x.toFixed(2) + "," + this.y.toFixed(2) + ")" ,x,y);

    }

    /*
     * The crosshair is composed of four "quadrant lines"
     * This method draws them.  The lines are numbered 1,2,3,4 and correspond the 
     * conventional mathematical quadrant locations, with the line at 0 degrees being 1,
     * 90 degress at 2, 180 at 3, and 270 at 4.
     */
    TableRipperUI.prototype.drawQuadLine = function(ctx, quad, color, width) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width || 1;
      ctx.beginPath();
      switch(quad) {
        case 1:
          ctx.moveTo(this.scale*this.x, this.scale*(this.h-this.y));
          ctx.lineTo(this.scale*this.x, 0);
          break;
        case 2:
          ctx.moveTo(0, this.scale*(this.h-this.y));
          ctx.lineTo(this.scale*this.x, this.scale*(this.h-this.y));
          break;
        case 3:
          ctx.moveTo(this.scale*this.x, this.scale*this.h);
          ctx.lineTo(this.scale*this.x, this.scale*(this.h-this.y));
          break;
        case 4:
          ctx.moveTo(this.scale*this.w, this.scale*(this.h-this.y));
          ctx.lineTo(this.scale*this.x, this.scale*(this.h-this.y));
          break;
        case 0:
        case 5:
          // These are valid but do nothing
          break

        default:
          throw new Error('Invalid quad line: ' + quad)
      }
      ctx.stroke();

    }

    /* 
     * Hit test for the provided mouse position:
     * Returns:
     *  - 1,2,3,4 : A quadrant line is hit
     *  - 5 : The circle in the center is is hit
     *  - 0 : No hit
     */
    TableRipperUI.prototype.hitTest = function(mousePos) {
      var RADIUS = 20
      
      // Check for hit in the middle circle, return 5 if so.
      var d = Math.sqrt(Math.pow(mousePos.x - this.x*this.scale, 2) + Math.pow(mousePos.y - (this.h-this.y)*this.scale, 2))
      if(d < RADIUS) {
        return 5;
      } 

      // Check for hit on the horizontal lines
      if(Math.abs(mousePos.x - this.x*this.scale) < RADIUS ) {
        if(mousePos.y < (this.h-this.y)*this.scale) {
          return 1;
        } else {
          return 3;
        }
      }

      // Check for hit on the vertical lines
      if(Math.abs(mousePos.y - (this.h-this.y)*this.scale) < RADIUS ) {
        if(mousePos.x < this.x*this.scale) {
          return 2;
        } else {
          return 4;
        }
      }
      return 0;
    }

    /*
     * Set the X location of the crosshair
     */
    TableRipperUI.prototype.setX = function(x) {
      this.x = x
    }

    /*
     * Set the Y location of the crosshair
     */
    TableRipperUI.prototype.setY = function(y) {
      this.y = y
    }

    /*
     * Set the XY location of the crosshair
     */
    TableRipperUI.prototype.setXY = function(x,y) {
      this.x = x;
      this.y = y;
      this.emit('change', {x:x,y:y,quads: Array.from(this.quads)});
      this.draw();
    }

    /*
     * Set the quadrant lines that are selected. (1,2,3,4)  If omitted, the set of selected lines is cleared.
     */
    TableRipperUI.prototype.setQuads = function(quads) {
      this.quads = new Set(quads || []);
      this.emit('change', {x:this.x,y:this.y,quads: Array.from(this.quads)});
      this.draw();
    };


    /*
     * Return a list of the selected quadrant lines (1,2,3,4)
     */
    TableRipperUI.prototype.getQuads = function() {
      return Array.from(this.quads);
    }

    /* 
     * Below here are event handlers and methods not intended to be called from outside this module
     */
    // Convenient function for getting the coordinates of the mouse inside the canvas (rather than global to the page)
    function getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      if(evt.changedTouches) {
        return {
          x : evt.changedTouches[0].clientX - rect.left,
          y : evt.changedTouches[0].clientY - rect.top,          
        }
      } else {
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };

      }
    }

    TableRipperUI.prototype.onMouseDown = function(evt) {
      var mousePos = getMousePos(this.cvs, evt);
      var x = mousePos.x/this.scale;
      var y = this.h - mousePos.y/this.scale;
      this.hilight_quadrant = 0;
      var hit = this.hitTest(mousePos);
      
      switch(hit) {
        case 5: 
          this.dragging = true;
          // Fall through on purpose
        case 0:
          this.setXY(x,y);
          break;
        default:
          this.toggleQuad(hit);
      }
      this.draw();
    }

    TableRipperUI.prototype.onMouseUp = function(evt) {
        this.hilight_quadrant = 0;
        this.stopDragging();
        this.draw();
    }
    TableRipperUI.prototype.onMouseLeave = function(evt) {
      this.hilight_quadrant = 0;
      this.stopDragging();
      this.draw();
    }


    TableRipperUI.prototype.onMouseMove = function(evt) {
      var mousePos = getMousePos(this.cvs, evt);
      var x = mousePos.x/this.scale;
      var y = this.h-mousePos.y/this.scale;
      if(this.dragging) {
        this.hilight_quadrant = 5;
        this.setXY(x,y)
      } else {
        if(evt.buttons || evt.changedTouches) {
          this.hilight_quadrant = 0;
        } else {
          this.hilight_quadrant = this.hitTest(mousePos);
        }

      }
      this.draw();
    }

    TableRipperUI.prototype.stopDragging = function() {
        if(this.dragging) {
          this.dragging = false;
          this.emit('change', {x:this.x,y:this.y, quads: Array.from(this.quads)});        
        }
    }
    TableRipperUI.prototype.emit = function(event_name, event) {
      this.listeners[event_name].forEach(function(listener) {
        listener(event);
      });
    }