function svg2canvas(element, svg, animateInterval) {
    // private members
    var x;
    var y;
    var posX;
    var posY;
    var action;
    var close;
    var val;
    var vals;
    var i; // position of reader
    var debugOutput = $('#svg-debug');
    var debugMsg = "";
    var pathRegEx = /<path d="([^"]*)"/g;
    var pathMatch;
    var drawInterval = 0;
    if (animateInterval != null)
        drawInterval = animateInterval;

    // private methods
    function reset() {
        x = 0;
        y = 0;
        posX = 0;
        posY = 0;
        action = "";
        close = "";
        val = "";
        vals = null;
        i = 0; // position of reader
    }
    function parse() {
        var word = "";
        while (word == "") {
            word = vals[i];
            i++;
        }

        if ('-0123456789'.indexOf(word[0]) == -1) {
            action = word[0];
            val = word.substring(1);
        } else if ('-0123456789'.indexOf(word[word.length-1]) == -1) {
            close = word[word.length-1];
            val = word.substring(0, word.length-1);
        } else {
            val = word;
        }

        return parseInt(val);
    }
    function read() {
        if (i+1 < vals.length) {
            x = parse();
            y = parse();
            return true;
        } else {
            return false;
        }
    }
    function debug(msg) {
        if (debugOutput == null)
            return;
        if (msg == null) {
            debugOutput.val(debugMsg);
        }
        debugMsg += msg;
    }
    function drawPathFragment() {
        close = "";

        switch(action) {
            case 'M': // absolute move to
                posX = x;
                posY = y;
                c.moveTo(posX, posY);
                debug("c.moveTo(" + posX + "," + posY + "));\r\n");
                break;
            case 'm': // relative move to
                posX += x;
                posY += y;
                c.moveTo(posX, posY);
                debug("c.moveTo(" + posX + "," + posY + "));\r\n");
                break;
            case 'c': // bezier to
                var x1 = posX + x;
                var y1 = posY + y;
                read();
                var x2 = posX + x;
                var y2 = posY + y;
                read();
                posX += x;
                posY += y;
                c.bezierCurveTo(x1, y1, x2, y2, posX, posY);
                debug("c.bezierCurveTo(" + x1 + "," + y1 + "," + x2 + "," + y2 + "," + posX + "," + posY + "));\r\n");
                break;
            case 'l': // line to
                posX += x;
                posY += y;
                c.lineTo(posX, posY);
                debug("c.lineTo(" + posX + "," + posY + ")\r\n");
                break;
            default:
                alert('? ' + action + ' ' + vals[i]);
        }

        if (close == 'z') {
            c.closePath()
                debug("c.closePath()\r\n");
        }
    }
    function drawPath(path) {
        c.beginPath();
        debug("c.beginPath()); //" + path + "\r\n");
        reset();
        vals = path.split(' ');
        while (read()) {
            drawPathFragment();
        }
        c.fill();
        debug("c.fill()\r\n");
    }
    function draw() {
        pathMatch = pathRegEx.exec(svg);
        if (pathMatch != null) {
            drawPath(pathMatch[1]);
            setTimeout(draw, drawInterval);
        } else { // Finished
            c.setTransform(1.0,0.0,0.0,1.0,0.0,0.0);
            debug(null);
        }
    }

    svg = svg.replace(/[\r\n\t ]+/g, ' ');
    //canvas.attr('svg', svg);

    var width = svg.match(/<svg [^>]*width="(\d*)/)[1];
    var height = svg.match(/<svg [^>]*height="(\d*)/)[1];

    var id = "svg_" + new Date().getTime();
    element.before($("<canvas id='" + id + "' width='" + width + "' height='" + height + "'>Your browser does not support the &lt;CANVAS&gt; element.</canvas>"));
    var canvas = document.getElementById(id);
    var c = canvas.getContext('2d');
    c.fillStyle = "white";
    c.strokeStyle = "black";
    c.globalAlpha = "1.0";
    c.lineWidth = "1";
    c.lineCap = "butt";
    c.lineJoin = "round";
    c.mitterLimit = "1";
    c.font = "normal normal 12 Courier";
    var xTranslate = svg.match(/<g [^>]*transform="[^"]*translate\(([^"\)]*)\)/)[1].split(',');
    var xScale = svg.match(/<g [^>]*transform="[^"]*scale\(([^"\)]*)\)/)[1].split(',');
    c.setTransform(xScale[0],0.0,0.0,xScale[1],xTranslate[0],xTranslate[1]);
    var fill = svg.match(/<g [^>]*fill="([^"]*)/)[1];
    c.fillStyle = fill;

    draw();
}

