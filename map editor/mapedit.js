function RGB_little_endian(r, g, b)
{
	return (b<<16)|(g<<8)|r;
}
function RGBA_CSS(r, g, b, a)
{
	return "rgba("+r.toString()+','+g.toString()+','+b.toString()+','+a.toString()+')';
}
function CircularIterator(base)
{
	this.array= base;
	this.currentIndex= -1;
	this.current= function()
	{
		this. currentIndex+= 1;
		if(this.currentIndex>=this.array.length)
		{
			this.currentIndex= 0;
		}
		return this.array[this.currentIndex];
	}
	return this;
}
function createText(font, color, fillColor, msg)
{
	var canvas= document.createElement("canvas");
	var ctx= canvas.getContext("2d");
	ctx.font= font;
	height= ctx.measureText('M').width;
	width= ctx.measureText(msg).width;
	var canvas= document.createElement("canvas");
	canvas.width= width;
	canvas.height= height*1.4;
	var ctx= canvas.getContext("2d");
	ctx.fillStyle= fillColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.font= font;
	ctx.fillStyle= color;
	ctx.fillText(msg, 0, canvas.height/4*3);
	data= canvas.toDataURL();
	return {image: data, height: canvas.height, width: canvas.width};
}
function createSprite(posX, posY, sizeX, sizeY, image)
{
	var square= new THREE.PlaneGeometry(1, 1);
	square.translate(0.5, 0.5, 0);
	if(typeof image==="number")
	{
		var material= new THREE.SpriteMaterial({color: image, side: THREE.BackSide});
	}
	else if(typeof image==="string")
	{
		var texture=new THREE.TextureLoader().load(image);
		texture.flipY= false;
		var material= new THREE.SpriteMaterial({map: texture, side: THREE.BackSide});
	}
	else
	{
		var material= image;
	}
	var mesh= new THREE.Sprite(material);
	mesh.center.set(0, 0);
	mesh.scale.set(sizeX, sizeY, 1);
	mesh.position.set(posX, posY, 0);
	return mesh;
}
function Pen(font, color, fillColor)
{
	this.font= font;
	this.color= color;
	this.fillColor= fillColor;
	this.write= function(posX, posY, width, height, text)
	{
		let t= createText(this.font, this.color, this.fillColor, text);
		return createSprite(posX, posY, width, height, t.image);
	}
	return this;
}
function vts(v)
{
	return '('+v.r.toString()+", "+v.g.toString()+", "+v.b.toString()+')';
}
function Tilesheet(path, size, cb)
{
	var tiles=[];
	var i= new Image();
	i.onload= function()
	{
		for(let y=0; y<size.y; y++)
		{
			for(let x=0; x<size.x; x++)
			{
				var c= document.createElement("canvas");
				c.width= 16;
				c.height= 16;
				var ctx= c.getContext("2d");
				ctx.drawImage(i, x*16, y*16, 16, 16, 0, 0, 16, 16);
				var t= new THREE.CanvasTexture(c);
				t.flipY= false;
				tiles.push(new THREE.SpriteMaterial({map: t, side: THREE.BackSide}));
			}
		}
		tiles.x= size.x;
		tiles.y= size.y;
		tiles.base= path;
		cb(tiles)
	}
	i.src= path;
}
function Point(x, y)
{
	this.x=x;
	this.y=y;
}
Point.prototype.toString= function()
{
	return '('+this.x.toString()+", "+this.y.toString()+')';
}
function PartialImage(path, sx, sy, w, h, cb)
{
	var i= new Image();
	i.onload = function()
	{
		var c = document.createElement("canvas");
		c.width = w;
		c.height = h;
		var ctx = c.getContext("2d");
		ctx.drawImage(i, sx, sy, w, h, 0, 0, w, h);
		var t = new THREE.CanvasTexture(c);
		t.flipY = false;
		cb(new THREE.SpriteMaterial({ map: t, side: THREE.BackSide }));
	}
	i.src = path;
}
targetWidth = 960;
targetHeight = 640;
function map_editor(tiles, prev_map_db)
{
	var selector_scene = new THREE.Scene();
	var selector_renderer = new THREE.WebGLRenderer({ alpha: true });
	selector_renderer.domElement.style.width = (16 * tiles.x).toString() + 'px';
	selector_renderer.domElement.style.height = (16 * tiles.y).toString() + 'px';
	selector_renderer.domElement.width = 16 * tiles.x;
	selector_renderer.domElement.height = 16 * tiles.y;
	selector_renderer.setSize(16 * tiles.x, 16 * tiles.y);
	let controls = document.getElementById("controls");
	controls.insertBefore(selector_renderer.domElement, controls.childNodes[0]);
	controls.style.display = "inline-block";
	var selector_camera = new THREE.OrthographicCamera(0, tiles.x * 16 + 4, 0, tiles.y * 16 + 4, 1, 1000);
	selector_camera.position.z = 1;
	selector_scene.add(selector_camera);
	PartialImage(tiles.base, 0, 0, 16 * tiles.x, 16 * tiles.y, function (t)
	{
		var selector_picker = createSprite(2, 2, 16 * tiles.x, 16 * tiles.y, t);
		var selector_indicator = createSprite(0, 0, 18, 18, "selector.png");
		selector_scene.add(selector_picker);
		selector_scene.add(selector_indicator);
		var selector = new THREE.Vector2(0, 0);
		var selected_tile = 0;
		selector_renderer.domElement.addEventListener("mousemove", function (e)
		{
			selector.set(Math.floor((e.offsetX + 2) / 16), Math.floor((e.offsetY + 2) / 16));
		});
		selector_renderer.domElement.addEventListener("click", function (e)
		{
			selector.set(Math.floor((e.offsetX + 2) / 16), Math.floor((e.offsetY + 2) / 16));
			selector_indicator.position.set(selector.x * 16, selector.y * 16, 0);
			selected_tile = (tiles.x * selector.y) + selector.x;
		});
		var current_color = 0xFFFFFF;
		var color_selector = document.getElementById("color_selector");
		color_selector.onchange = function (e)
		{
			current_color = parseInt(color_selector.value.replace('#', "0x"));
			selector_picker.material.color.set(current_color);
		}
		var triggers = {};
		var npcs = {};
		var items = {};
		map_scene = new THREE.Scene();
		var map_renderer = new THREE.WebGLRenderer();
		map_renderer.domElement = document.body.appendChild(map_renderer.domElement);
		map_renderer.domElement.style.display = "inline-block";
		map_renderer.domElement.style["flex-grow"] = 1;
		map_renderer.domElement.width = map_renderer.domElement.clientWidth;
		map_renderer.domElement.height = map_renderer.domElement.clientHeight;
		map_renderer.setSize(map_renderer.domElement.width, map_renderer.domElement.height)
		var map_camera = new THREE.OrthographicCamera(0, targetWidth, 0, targetHeight, 1, 1000);
		map_camera.position.z = 1;
		map_scene.add(map_camera);
		var mouse = new THREE.Vector2();
		mouse.down = false;
		map_renderer.domElement.addEventListener("mousemove", function (e)
		{
			mouse.set(Math.floor((e.offsetX / map_renderer.domElement.width) * targetWidth), Math.floor((e.offsetY / map_renderer.domElement.height) * targetHeight));
			if (mouse.down)
			{
				var b = { x: Math.floor(mouse.x / 16), y: Math.floor(mouse.y / 16) };
				if (document.querySelector('input[name="mode"]:checked').value == "edit")
				{
					let prev = map_scene.children.filter(function (o) { return o.position.equals(new THREE.Vector3(b.x * 16, b.y * 16, 0)) })[0];
					if (prev)
					{
						if (prev.material.name == "dispose") prev.material.dispose();
						map_scene.remove(prev);
					}
					if (current_color == 0xFFFFFF) var s = createSprite(b.x * 16, b.y * 16, 16, 16, tiles[selected_tile]);
					else
					{
						let t = tiles[selected_tile].clone();
						t.color.set(current_color);
						var s = createSprite(b.x * 16, b.y * 16, 16, 16, t);
					}
					s.userData.tile = selected_tile;
					map_scene.add(s);
				}
				else
				{
					let v = document.getElementById("value_text").value;
					let mode = document.querySelector('input[name="mode"]:checked').value;
					if (mode == "trigger")
					{
						if (triggers[b]) triggers[b].push(v);
						else triggers[b] = [v];
					}
					else if (mode == "npc") npcs[b] = v;
					else if (mode == "item") items[b] = v;
					else if (mode == "clear")
					{
						triggers[b] = undefined;
						npcs[b] = undefined;
						items[b] = undefined;
					}
					else if (mode == "view")
					{
						tv = document.getElementById("tile_view");
						tv.innerHTML = "<br>Tile: (" + b.x.toString() + ", " + b.y.toString() + ")<br>" +
						"NPCs: " + (npcs[b] ? npcs[b].toString() : "None") + "<br>" +
						"Color: " + vts((map_scene.children.filter(function (o) { return o.position.equals(new THREE.Vector3(b.x * 16, b.y * 16, 0)) })[0].material.color)) + "<br>" +
						"Items: " + (items[b] ? items[b].toString() : "None") + "<br>" +
						"Triggers: " + (triggers[b] ? triggers[b].toString() : "None") + "<br>";
					}
					else console.error("How did we get here");
				}

			}
		});
		map_renderer.domElement.addEventListener("mousedown", function ()
		{
			mouse.down = true;
			var b = new Point(Math.floor(mouse.x / 16), Math.floor(mouse.y / 16));
			if (document.querySelector('input[name="mode"]:checked').value == "edit")
			{
				let prev = map_scene.children.filter(function (o) { return o.position.equals(new THREE.Vector3(b.x * 16, b.y * 16, 0)) })[0];
				if (prev)
				{
					if (prev.material.disposable) prev.material.dispose();
					map_scene.remove(prev);
				}
				if (current_color == 0xFFFFFF) var s = createSprite(b.x * 16, b.y * 16, 16, 16, tiles[selected_tile]);
				else
				{
					let t = tiles[selected_tile].clone();
					t.color.set(current_color);
					t.disposable= true;
					var s = createSprite(b.x * 16, b.y * 16, 16, 16, t);
				}
				s.userData.tile = selected_tile;
				map_scene.add(s);
			}
			else
			{
				let v = document.getElementById("value_text").value;
				let mode = document.querySelector('input[name="mode"]:checked').value;
				if (mode == "trigger")
				{
					if (triggers[b]) triggers[b].push(v);
					else triggers[b] = [v];
				}
				else if (mode == "npc") npcs[b] = v;
				else if (mode == "item") items[b] = v;
				else if (mode == "clear")
				{
					triggers[b] = undefined;
					npcs[b] = undefined;
					items[b] = undefined;
				}
				else if (mode == "view")
				{
					tv = document.getElementById("tile_view");
					tv.innerHTML = "<br>Tile: (" + b.x.toString() + ", " + b.y.toString() + ")<br>" +
					"Color: " + (map_scene.children.filter(function (o) { return o.position.equals(new THREE.Vector3(b.x * 16, b.y * 16, 0)) })[0].material.color.getHexString()) + "<br>" +
					"NPCs: " + (npcs[b] ? npcs[b].toString() : "None") + "<br>" +
					"Items: " + (items[b] ? items[b].toString() : "None") + "<br>" +
					"Triggers: " + (triggers[b] ? triggers[b].toString() : "None") + "<br>";
				}
				else console.error("How did we get here");
			}
		});
		map_renderer.domElement.addEventListener("mouseup", function () { mouse.down = false; });
		if(prev_map_db)
		{
			prev_map= new DataView(prev_map_db);
			let current_byte= 0;
			for (let y = 0; y < (targetHeight / 16) ; y++)
			{
				for (let x = 0; x < (targetWidth / 16) ; x++)
				{
					let tile=prev_map.getUint16(current_byte, true);
					current_byte += 2;
					let r= prev_map.getUint8(current_byte);
					current_byte += 1;
					let g= prev_map.getUint8(current_byte);
					current_byte += 1;
					let b= prev_map.getUint8(current_byte);
					current_byte += 1;
					let color= RGB_little_endian(b, g, r);
					let m= tiles[tile];
					if(color!=0xFFFFFF)
					{
						m= m.clone();
						m.color.set(color);
						m.disposable= true;
						console.log("0x"+color.toString(16));
						console.log(tile.toString());
					}
					let o= createSprite(x*16, y*16, 16, 16, m);
					map_scene.add(o);
				}
			}
		}
		else
		{
			for (let y = 0; y < (targetHeight / 16) ; y++)
			{
				for (let x = 0; x < (targetWidth / 16) ; x++)
				{
					let o= createSprite(x*16, y*16, 16, 16, tiles[0]);
					map_scene.add(o);
				}
			}

		}
		document.getElementById("save_button").addEventListener("click", function ()
		{
			let totalsize = (targetWidth / 16) * (targetHeight / 16) * 6 + 6;
			for (let p in items)
			{
				totalsize += items[p].length * 2 + 2;
			}
			for (let p in npcs)
			{
				totalsize += npcs[p].length * 2 + 2;
			}
			for (let p in triggers)
			{
				totalsize += triggers[p].length * 2 + 2;
			}
			var map_buffer = new ArrayBuffer(totalsize);
			var map = new DataView(map_buffer);
			let current_byte = 0;
			for (let y = 0; y < (targetHeight / 16) ; y++)
			{
				for (let x = 0; x < (targetWidth / 16) ; x++)
				{
					let o = map_scene.children.filter(function (o) { return o.position.equals(new THREE.Vector3(x * 16, y * 16, 0)) })[0];
					if (!o) o = { userData: { tile: 0 }, position: new THREE.Vector3(x*16, y*16, 0), material: { color: { getHexString: function(){return "FFFFFF";} } } };
					map.setUint16(current_byte, o.userData.tile, true);
					current_byte += 2;
					let r= parseInt("0x"+o.material.color.getHexString().slice(0, 2))
					let g= parseInt("0x"+o.material.color.getHexString().slice(2, 4))
					let b= parseInt("0x"+o.material.color.getHexString().slice(4, 6))
					map.setUint8(current_byte, r);
					current_byte += 1;
					map.setUint8(current_byte, g);
					current_byte += 1;
					map.setUint8(current_byte, b);
					current_byte += 1;
				}
			}
			for (let p in items)
			{
				map.setUint8(current_byte, p.x);
				current_byte += 1;
				map.setUint8(current_byte, p.y);
				current_byte += 1;
				for (let i = 0; i < items[p].length; i++)
				{
					map.setUint16(current_byte, items[p].charCodeAt(i));
					current_byte += 2;
				}
			}
			map.setUint16(current_byte, 0);
			current_byte += 2;
			for (let p in npcs)
			{
				map.setUint8(current_byte, p.x);
				current_byte += 1;
				map.setUint8(current_byte, p.y);
				current_byte += 1;
				for (let i = 0; i < npcs[p].length; i++)
				{
					map.setUint16(current_byte, npcs[p].charCodeAt(i));
					current_byte += 2;
				}
			}
			map.setUint16(current_byte, 0);
			current_byte += 2;
			for (let p in triggers)
			{
				map.setUint8(current_byte, p.x);
				current_byte += 1;
				map.setUint8(current_byte, p.y);
				current_byte += 1;
				for (let i = 0; i < triggers[p].length; i++)
				{
					map.setUint16(current_byte, triggers[p].charCodeAt(i));
					current_byte += 2;
				}
			}
			let map_blob = new Blob([map_buffer]);
			let map_url = URL.createObjectURL(map_blob);
			let downloader = document.createElement("a");
			downloader.hidden = true;
			document.body.appendChild(downloader)
			downloader.href = map_url;
			downloader.download = "new.map";
			downloader.click();
		});
		function render()
		{
			//Main loop
			map_renderer.render(map_scene, map_camera);
			selector_renderer.render(selector_scene, selector_camera)
			requestAnimationFrame(render);
		}
		render();
	});
}
function map_determine(tiles)
{
	let form = document.getElementById("tilesheet");
	form.style.display= "none";
	mfi = document.getElementById("map_file")
	if (mfi.files.length)
	{
		var fr= new FileReader();
		fr.onload= function(map)
		{
			map_editor(tiles, map.target.result)
		}
		fr.readAsArrayBuffer(mfi.files[0])
	}
	else
	{
		map_editor(tiles, false)
	}
}
function main()
{
	var fr = new FileReader();
	fr.onload = function (e)
	{
		var path = e.target.result;
		console.log(path);
		var tilesheet_size = {};
		tilesheet_size.x = parseInt(document.getElementById("tilesheet_x").value);
		tilesheet_size.y = parseInt(document.getElementById("tilesheet_y").value);
		Tilesheet(path, tilesheet_size, map_determine);
	}
	fr.readAsDataURL(document.getElementById("tilesheet_file").files[0]);
}
