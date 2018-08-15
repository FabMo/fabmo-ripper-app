    function getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
    }

    function TableRipperUI(element, options) {
      this.cvs = element;
      options = options || {};
      this.w = options.w || 96.0;
      this.h = options.h || 48.0;
      this.x = this.w/2;
      this.y = this.h/2;
      this.aspect = this.h/this.w;
      this.hilight_quadrant = 0;
      this.quads = new Set();
      this.dragCoordinates = null;
      this.cvs.addEventListener('mousedown',this.onMouseDown.bind(this), false);
      this.cvs.addEventListener('mouseup',this.onMouseUp.bind(this), false);
      this.cvs.addEventListener('mouseleave',this.onMouseLeave.bind(this), false);
      this.cvs.addEventListener('mousemove',this.onMouseMove.bind(this), false);
      this.listeners = {
        'change' : []
      };
    }
    
    TableRipperUI.prototype.on = function(evt, listener) {
      if(evt in this.listeners) {
        this.listeners['change'].push(listener);
      }
    }
    TableRipperUI.prototype.emit = function(event_name, event) {
      this.listeners[event_name].forEach(function(listener) {
        listener(event);
      });
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
        this.stopDragging();
    }
    TableRipperUI.prototype.onMouseLeave = function(evt) {
      this.hilight_quadrant = 0;
      this.stopDragging();
      this.draw();
    }

    TableRipperUI.prototype.toggleQuad = function(quad) {
      if(this.quads.has(quad)) {
        this.quads.delete(quad);
      } else {
        this.quads.add(quad);
      }
      this.emit('change', {x:this.x,y:this.y, quads: Array.from(this.quads)});
    }

    TableRipperUI.prototype.onMouseMove = function(evt) {
      var mousePos = getMousePos(this.cvs, evt);
      var x = mousePos.x/this.scale;
      var y = this.h-mousePos.y/this.scale;
      if(this.dragging) {
        this.hilight_quadrant = 5;
        this.setXY(x,y)
      } else {
        if(evt.buttons) {
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

    TableRipperUI.prototype.draw = function() {
      var ctx = this.cvs.getContext('2d');

      // Gradient
      var grd=ctx.createLinearGradient(0,0,0,this.h*this.scale);
      grd.addColorStop(0,"#dddddd");
      grd.addColorStop(1,"white");
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
      }
      ctx.stroke();

    }

    TableRipperUI.prototype.hitTest = function(mousePos) {
      var RADIUS = 20
      var d = Math.sqrt(Math.pow(mousePos.x - this.x*this.scale, 2) + Math.pow(mousePos.y - (this.h-this.y)*this.scale, 2))
      if(d < RADIUS) {
        return 5;
      } 

      if(Math.abs(mousePos.x - this.x*this.scale) < RADIUS ) {
        if(mousePos.y < (this.h-this.y)*this.scale) {
          return 1;
        } else {
          return 3;
        }
      }
      if(Math.abs(mousePos.y - (this.h-this.y)*this.scale) < RADIUS ) {
        if(mousePos.x < this.x*this.scale) {
          return 2;
        } else {
          return 4;
        }
      }
      return 0;
    }

    TableRipperUI.prototype.setX = function(x) {
      this.x = x
    }

    TableRipperUI.prototype.setY = function(y) {
      this.y = y
    }

    TableRipperUI.prototype.setXY = function(x,y) {
      this.x = x;
      this.y = y;
      this.emit('change', {x:x,y:y,quads: Array.from(this.quads)});
      this.draw();
    }

    TableRipperUI.prototype.setQuads = function(quads) {
      this.quads = new Set(quads);
      console.log(this.quads)
      this.emit('change', {x:this.x,y:this.y,quads: Array.from(this.quads)});
      this.draw();
    };

    TableRipperUI.prototype.getQuads = function() {
      return Array.from(this.quads);
    }