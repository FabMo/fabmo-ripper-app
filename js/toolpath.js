    function createSBPCode(options) {
      var options = options || {};
      var safeZ = options.safeZ || 2.0;
      var quads = new Set(options.quads)
      var x = options.x;
      var y = options.y;
      var h = options.h;
      var w = options.w;
      var thickness = options.thickness;
      var cut_through = options.cut_through;

      function m2(x,y) {
        return "M2," + x.toFixed(5) + "," + y.toFixed(5);
      }
      function j2(x,y) {
        return "J2," + x.toFixed(5) + "," + y.toFixed(5);
      }
      function mz(z) {
        return "MZ," + z.toFixed(5);
      }
      function jz(z) {
        return "JZ," + z.toFixed(5);
      }

      function cut(a,b,c) {
        var retval = [];
        retval.push(jz(safeZ));
        retval.push(j2(a.x,a.y));
        retval.push(mz(0));
        retval.push(m2(b.x,b.y));
        if(c) {
          retval.push(m2(c.x,c.y));          
        }
        retval.push(jz(safeZ));  
        return retval;    
      }

      if(quads.size > 0) {
        var sbp = [
          "' Created by THE RIPPER",
          ""
        ]

        sbp.push("' Select Tool")
        sbp.push('&Tool = 1');
        sbp.push('C9\n');
        sbp.push(jz(safeZ));
        sbp.push("' Spindle on")
        sbp.push('C6\n');

        
        var ripTable = {
          1 : {x:x, y:h},
          2 : {x:0, y:y},
          3 : {x:x, y:0},
          4 : {x:w, y:y}
        }

        if(quads.has(1) && quads.has(3)) {
          sbp.push("' Rip Y")
          sbp.push.apply(sbp, cut(ripTable[1], ripTable[3]));
          quads.delete(1)
          quads.delete(3)
          sbp.push('');
        }

        if(quads.has(2) && quads.has(4)) {
          sbp.push("' Rip X")
          sbp.push.apply(sbp, cut(ripTable[2], ripTable[4]));
          quads.delete(2)
          quads.delete(4)
          sbp.push('');
        }

        if(quads.size > 0) {
          sbp.push(quads.size == 2 ? "' Rip quadrant" : "' Rip segment");
          var values = Array.from(quads);
          sbp.push.apply(sbp, cut(ripTable[values[0]], {x:x,y:y}, ripTable[values[1]]));
        }
      }

      sbp.push("\n' Spindle off");
      sbp.push('C7');
      sbp.push('\nEND');

      return sbp.join('\n');
    }