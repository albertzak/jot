/*
 * ext-grid.js
 *
 * Licensed under the Apache License, Version 2
 *
 * Copyright(c) 2010 Redou Mine
 * Copyright(c) 2010 Alexis Deveria
 *
 */

// Dependencies:
// 1) units.js
// 2) everything else

methodDraw.addExtension("view_grid", function(s) {
    if (!document.getElementById("canvasGrid")){
    var svgdoc = document.getElementById("svgcanvas").ownerDocument,
			svgns = "http://www.w3.org/2000/svg",
			dims = methodDraw.curConfig.dimensions,
			svgroot = s.svgroot;
    var svgCanvas = methodDraw.canvas;
	var showGrid = false;
    var assignAttributes = s.assignAttributes;

    var hcanvas = document.createElement('canvas');
    $(hcanvas).hide().appendTo('body');

    var canvasgrid = svgdoc.createElementNS(svgns, "g");
    assignAttributes(canvasgrid, {
        'id': 'canvasGrid',
        'width': '100%',
        'height': '100%',
        'x': 0,
        'y': 0,
        'overflow': 'visible',
        'display': 'inline'
    });

    var canvBG = $('#canvas_background');
    canvBG.after(canvasgrid);



        // grid-pattern
        var gridPattern = svgdoc.createElementNS(svgns, "pattern");
        assignAttributes(gridPattern, {
            'id': 'gridpattern',
            'patternUnits': 'userSpaceOnUse',
            'width': 19,
            'height': 19
        });


        var gridPath = svgdoc.createElementNS(svgns, "path");
        assignAttributes(gridPath, {
            'id': 'gridPath',
            'd': 'M 19 0 L 0 0 0 19',
            'fill': 'none',
            'stroke': methodDraw.curConfig.gridColor,
            'stroke-width': '0.5'
        });

        gridPattern.appendChild(gridPath);

        $('#svgroot defs').append(gridPattern);

        // grid-box
        var gridBox = svgdoc.createElementNS(svgns, "rect");
        assignAttributes(gridBox, {
            'width': '100%',
            'height': '100%',
            'x': 0,
            'y': 0,
            'stroke-width': 0,
            'stroke': 'none',
            'fill': 'url(#gridpattern)',
            'style': 'pointer-events: none; display:visible;'
        });
        $('#canvasGrid').append(gridBox);

        // pagre break

        var gridPagebreak = svgdoc.createElementNS(svgns, "pattern");
        assignAttributes(gridPagebreak, {
            'id': 'gridpagebreak',
            'patternUnits': 'userSpaceOnUse',
            'width': 794,
            'height': 1121
        });

        var gridPagebreakPath = svgdoc.createElementNS(svgns, "rect");
        assignAttributes(gridPagebreakPath, {
            'id': 'gridPagebreakPath',
            'x': 0,
            'y': 0,
            'width': 794,
            'height': 19,
            'fill': '#3f3f3c',
            'stroke': 'none',
            'stroke-width': '0'
        });

        gridPagebreak.appendChild(gridPagebreakPath);
        $('#svgroot defs').append(gridPagebreak);

        var boxPagebreak = svgdoc.createElementNS(svgns, "rect");
        assignAttributes(boxPagebreak, {
            'width': '100%',
            'height': '100%',
            'x': 0,
            'y': 0,
            'stroke-width': 0,
            'stroke': 'none',
            'fill': 'url(#gridpagebreak)',
            'style': 'pointer-events: none; display:visible;'
        });
        $('#canvasGrid').append(boxPagebreak);
        }
//     });

	function updateGrid(zoom) {
		// TODO: Try this with <line> elements, then compare performance difference

		var bgwidth = +canvBG.attr('width');
		var bgheight = +canvBG.attr('height');

		var units = svgedit.units.getTypeMap();
		var unit = units[methodDraw.curConfig.baseUnit]; // 1 = 1px
		var r_intervals = [.01, .1, 1, 10, 100, 1000];

		var d = 0;
		var is_x = (d === 0);
		var dim = is_x ? 'x' : 'y';
		var lentype = is_x?'width':'height';
		var c_elem = svgCanvas.getContentElem();
		var content_d = c_elem.getAttribute(dim)-0;

		var hcanv = hcanvas;

		var u_multi = unit * zoom;

		// Calculate the main number interval
		var raw_m = 100 / u_multi;
		var multi = 1;
		for(var i = 0; i < r_intervals.length; i++) {
			var num = r_intervals[i];
			multi = num;
			if(raw_m <= num) {
				break;
			}
		}

		var big_int = multi * u_multi;

		// Set the canvas size to the width of the container
		hcanv.width = big_int;
		hcanv.height = big_int;
		var ctx = hcanv.getContext("2d");

		var ruler_d = 0;
		var cur_d = .5;

		var part = big_int / 10;

		ctx.globalAlpha = 0.2;
		ctx.strokeStyle = "#000";
		for(var i = 1; i < 10; i++) {
			var sub_d = Math.round(part * i) + .5;
			var line_num = (i % 2)?12:10;
			ctx.moveTo(sub_d, big_int);
			ctx.lineTo(sub_d, line_num);
			ctx.moveTo(big_int, sub_d);
			ctx.lineTo(line_num ,sub_d);
		}
		ctx.stroke();
		ctx.beginPath();
		ctx.globalAlpha = 0.5;
		ctx.moveTo(cur_d, big_int);
		ctx.lineTo(cur_d, 0);

		ctx.moveTo(big_int, cur_d);
		ctx.lineTo(0, cur_d);
		ctx.stroke();

		var datauri = hcanv.toDataURL('image/png');
		gridPath.setAttribute('width', big_int);
		gridPath.setAttribute('height', big_int);
		gridPath.parentNode.setAttribute('width', big_int);
		gridPath.parentNode.setAttribute('height', big_int);
		svgCanvas.setHref(gridPath, datauri);
	}

    return {
        name: "view_grid",
        zoomChanged: function(zoom) {
            // update size
            if(showGrid) updateGrid(zoom);
        },

        buttons: [{
            id: "view_grid",
            type: "menu",
            after: "tool_snap",
            panel: "view_menu",
            title: "Hide Grid",
            events: {
                'click': function() {
                    var gr = $('#view_grid').hasClass('push_button_pressed');
                    if (gr) {
                        methodDraw.curConfig.showGrid = showGrid = true;
                        $('#view_grid').removeClass('push_button_pressed');
                        $('#canvasGrid').attr('display', 'inline');
                        updateGrid(svgCanvas.getZoom());
                    } else {
                        methodDraw.curConfig.showGrid = showGrid = false;
                        $('#view_grid').addClass('push_button_pressed');
                        $('#canvasGrid').attr('display', 'none');
                    }
                }
            }
        }]
    };
});
