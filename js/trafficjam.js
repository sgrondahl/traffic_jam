/*global jQuery $*/

var TrafficGame = (function TrafficGameClosure() {

    function TrafficGame(el, kwargs) {
	var self = this;
	this.$topel = $(el);
	this.$el = $(document.createElement('div')).addClass('traffic-game');
	this.$topel.append(self.$el);
	this.pieces = [];
	this.makeCells(kwargs.height, kwargs.width);
	this.addPieces(kwargs.pieces);
    }


    TrafficGame.prototype = {

	makeCells : function(h, w) {
	    var h_pct = 100.0 / h,
		w_pct = 100.0 / w,
		i = 0,
		j = 0,
		self = this;

	    this.cells = [[]];
	    this.cell_width = w_pct;
	    this.cell_height = h_pct;

	    // Create the cells of the board.
	    for (i = 0; i < h; i++) {
		// Index by [row][column].
		this.cells[i] = [];
		for (j = 0; j < w; j++) {
		    this.cells[i].push(
			new TrafficCell(this.$el, 
					{ height: h_pct + '%',
					  width: w_pct + '%',
					  top:  (i * h_pct) +  '%',
					  left:  (j * w_pct) + '%' }));
		}
	    }

	    // Let cells calculate their positions now that they've
	    // been rendered.
	    window.setTimeout(function() {
		for (i = 0; i < self.cells.length; i++) {
		    for (j = 0; j < self.cells[i].length; j++) {
			self.cells[i][j].calculatePosition();
		    }
		}
	    }, 1);
	    
	},
	
	findClosestCell : function(x, y) {
	    var distance = Infinity,
		cell = this.cells[0][0];

	    for (var i = 0; i < this.cells.length; i++) {
		for (var j = 0; j < this.cells[i].length; j++) {
		    var t_dist = this.cells[i][j].getDistance(x, y);
		    this.cells[i][j].unhighlight();
		    if (t_dist < distance) {
			distance = t_dist;
			cell = this.cells[i][j];
		    }
		}
	    }

	    return cell;
	},

	addPieces : function(pieces) {
	    var self = this;
	    pieces.forEach(function(p) { self.addPiece(p); });
	},

	addPiece : function(kwargs) {
	    this.pieces.push(new TrafficPiece(this, kwargs));
	}
    };
    

    return TrafficGame;

})();

var TrafficCell = (function TrafficCellClosure() {
    
    function TrafficCell(holder, kwargs) {
	this.$el = 
	    $(document.createElement('div'))
	    .addClass('traffic-cell')
	    .css('height', kwargs.height)
	    .css('width', kwargs.width)
	    .css('top', kwargs.top)
	    .css('left', kwargs.left);
	this.$el.appendTo(holder);

	this.top = undefined;
	this.bottom = undefined;
	this.left = undefined;
	this.right = undefined;
    }

    
    TrafficCell.prototype = {

	calculatePosition : function() {
	    var offset = this.$el.offset(),
		width = this.$el.width(),
		height = this.$el.height();
	    this.top = offset.top;
	    this.bottom = offset.top + height;
	    this.left = offset.left;
	    this.right = offset.left + width;
	},

	getDistance : function(x, y) {
	    function coordDistance(p, lower, upper) {
		var d = p <= upper && p >= lower ?
			0 :
			Math.min.apply(null, [upper - p, lower - p].map(Math.abs));

		// console.log('Point: ' + p + ' vs coord (' + lower + ', ' + upper +')'+
		//  	    'for distance: ' + d);

		return d;
		// return p <= upper && p >= lower ?
		//     0 :
		//     Math.min.apply(null, [upper - p, lower - p].map(Math.abs));
	    }

	    var self = this,
		h_coord = Math.pow(coordDistance(x, self.left, self.right), 2),
		v_coord = Math.pow(coordDistance(y, self.top, self.bottom), 2),
		cd = Math.sqrt(h_coord + v_coord);
	

	    // console.log('Mouse position is: (' + x + ', ' + y + '), ' +
	    // 		'cell position is: (' + self.left + ', ' + self.right +
	    // 		', ' + self.top + ', ' + self.bottom + '), ' +
	    // 		'distance is: ' + cd + ', from: (' +
	    // 		h_coord + ', ' + v_coord + ')');

	    return cd;

	    // return Math.sqrt(coordDistance(x, self.left, self.right) ^ 2 +
	    // 		     coordDistance(y, self.top, self.bottom) ^ 2);
	},

	highlight : function() {
	    this.$el.css('background', '#ACA');
	},

	unhighlight : function() {
	    this.$el.css('background', 'none');
	}

    };


    return TrafficCell;

})();


var TrafficPiece = (function TrafficPieceClosure() {

    function TrafficPiece(game, kwargs) {
	this.$el = $(document.createElement('div')).addClass('traffic-piece');
	this.game = game;
	this.tl_cell = game.cells[kwargs.row][kwargs.col];
	this.row = kwargs.row;
	this.col = kwargs.col;
	this.height = kwargs.height;
	this.width = kwargs.width;
	this.render();
	this.$el.appendTo(game.$el);
	this.bindDrag();
    }

    TrafficPiece.prototype = {

	render : function(offsetX, offsetY) {
	    var self = this;
	    offsetX = offsetX | 0;
	    offsetY = offsetY | 0;
	    this.$el
	    	.css('height', (self.height * self.game.cell_height) + '%')
		.css('width', (self.width * self.game.cell_width) + '%')
		.css('top', ((self.row + offsetY) * self.game.cell_height) + '%')
		.css('left', ((self.col + offsetX) * self.game.cell_width) + '%');

	},
	
	bindDrag : function() {
	    var self = this;

	    this.$el.mousedown(function(down_evt) {
		var start_x = down_evt.pageX,
		    start_y = down_evt.pageY,
		    cell_w_px = self.tl_cell.right - self.tl_cell.left,
		    cell_h_px = self.tl_cell.bottom - self.tl_cell.top;
		$(document).on('mousemove.traffic-piece-mouse', function(evt) {
		    self.render(
			Math.round((evt.pageX - start_x) / cell_w_px),
			Math.round((evt.pageY - start_y) / cell_h_px)
		    );
		});
		$(document).mouseup(function() {
		    self.render();
		    $(document).off('.traffic-piece-mouse');
		    console.log('mouseup');
		});
	    });
	}

    };

    return TrafficPiece;

})();
