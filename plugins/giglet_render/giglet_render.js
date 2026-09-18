/*
 * GIGLET Render Core 1.0.0
 * Progressive CPU path tracer running in a Web Worker.
 *
 * This first renderer intentionally uses Blockbench's existing scene geometry
 * as input and keeps rendering isolated from Blockbench's viewport renderer.
 */
(function() {
	const PLUGIN_ID = "giglet_render";
	let renderAction;
	let dialog;
	let worker;
	let renderCanvas;
	let statusNode;
	let sampleNode;
	let stopButton;
	let startButton;

	Plugin.register(PLUGIN_ID, {
		title: "GIGLET Render",
		author: "Olive",
		description: "Progressive offline ray renderer for Blockbench.",
		version: "1.0.0",
		min_version: "4.8.0",
		variant: "both",
		onload() {
			renderAction = new Action("giglet_render_open", {
			name: "GIGLET Render",
			icon: "photo_camera",
			description: "Render the current Blockbench model with the GIGLET ray renderer.",
			click: openRenderer
		});
		MenuBar.addAction(renderAction, "tools");
	},
		onunload() {
		stopRender();
		if (dialog) dialog.hide();
		if (renderAction) renderAction.delete();
	}
	});

	function openRenderer() {
		if (!dialog) createDialog();
		dialog.show();
		refreshPreview();
	}

	function createDialog() {
		const html = `
		<div style="display:flex;flex-direction:column;height:100%;gap:8px;">
			<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
				<label>Width <input id="giglet_width" type="number" min="64" max="1024" value="320" style="width:70px"></label>
				<label>Height <input id="giglet_height" type="number" min="64" max="1024" value="320" style="width:70px"></label>
				<label>Samples <input id="giglet_samples" type="number" min="1" max="4096" value="64" style="width:70px"></label>
				<label>Bounces <input id="giglet_bounces" type="number" min="1" max="8" value="3" style="width:55px"></label>
				<button id="giglet_start">Render</button>
				<button id="giglet_stop" disabled>Stop</button>
				<button id="giglet_save">Save PNG</button>
			</div>
			<div id="giglet_status">Ready.</div>
			<div style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:#181818;overflow:auto;">
				<canvas id="giglet_canvas" style="max-width:100%;max-height:100%;image-rendering:auto;"></canvas>
			</div>
		</div>`;

		dialog = new Dialog({
			id: "giglet_render_dialog",
			title: "GIGLET Render",
			width: 760,
			height: 720,
			component: { template: html }
		});
		dialog.onOpen = () => {
			renderCanvas = document.getElementById("giglet_canvas");
			statusNode = document.getElementById("giglet_status");
			sampleNode = statusNode;
			startButton = document.getElementById("giglet_start");
			stopButton = document.getElementById("giglet_stop");
			startButton.onclick = startRender;
			stopButton.onclick = stopRender;
			document.getElementById("giglet_save").onclick = saveRender;
			refreshPreview();
		};
	}

	function setStatus(text) {
		if (statusNode) statusNode.textContent = text;
	}

	function refreshPreview() {
		if (!renderCanvas) return;
		renderCanvas.width = 1;
		renderCanvas.height = 1;
		const ctx = renderCanvas.getContext("2d");
		ctx.fillStyle = "#202020";
		ctx.fillRect(0, 0, 1, 1);
	}

	function stopRender() {
		if (worker) {
			worker.terminate();
			worker = null;
		}
		if (stopButton) stopButton.disabled = true;
		if (startButton) startButton.disabled = false;
	}

	function saveRender() {
		if (!renderCanvas || renderCanvas.width < 2) return;
		renderCanvas.toBlob(blob => {
			if (!blob) return;
			Blockbench.export({
				resource_id: "giglet_render.png",
				type: "image",
				content: blob
			});
		});
	}

	function readNumber(id, fallback) {
		const node = document.getElementById(id);
		const value = Number(node && node.value);
		return Number.isFinite(value) ? value : fallback;
	}

	function collectScene() {
		const triangles = [];
		const elements = (Outliner && Outliner.elements) ? Outliner.elements : [];
		const temp = new THREE.Vector3();

		for (const element of elements) {
			const mesh = element.mesh;
			if (!mesh || !mesh.geometry || !mesh.visible || element.visibility === false) continue;
			const geometry = mesh.geometry;
			const position = geometry.attributes && geometry.attributes.position;
			if (!position) continue;

			mesh.updateMatrixWorld(true);
			const matrix = mesh.matrixWorld;
			const index = geometry.index;
			const count = index ? index.count : position.count;

			function point(i) {
				temp.fromBufferAttribute(position, i).applyMatrix4(matrix);
				return [temp.x, temp.y, temp.z];
			}

			for (let i = 0; i + 2 < count; i += 3) {
				const ia = index ? index.getX(i) : i;
				const ib = index ? index.getX(i + 1) : i + 1;
				const ic = index ? index.getX(i + 2) : i + 2;
				triangles.push({a: point(ia), b: point(ib), c: point(ic), color: [0.72, 0.72, 0.72]});
			}
		}
		return triangles;
	}

	function boundsOf(triangles) {
		const min = [Infinity, Infinity, Infinity];
		const max = [-Infinity, -Infinity, -Infinity];
		for (const t of triangles) {
			for (const p of [t.a, t.b, t.c]) {
				for (let i = 0; i < 3; i++) {
					if (p[i] < min[i]) min[i] = p[i];
					if (p[i] > max[i]) max[i] = p[i];
				}
			}
		}
		return {min, max};
	}

	function buildCamera(triangles) {
		const b = boundsOf(triangles);
		const center = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
		const size = Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2], 1);
		return {
			position: [center[0] + size * 2.2, center[1] + size * 1.35, center[2] + size * 2.2],
			target: [center[0], center[1] + (b.max[1] - b.min[1]) * 0.15, center[2]],
			fov: 48
		};
	}

	function startRender() {
		stopRender();
		const triangles = collectScene();
		if (!triangles.length) {
			setStatus("No visible renderable geometry found.");
			return;
		}

		const width = Math.max(64, Math.min(1024, Math.floor(readNumber("giglet_width", 320))));
		const height = Math.max(64, Math.min(1024, Math.floor(readNumber("giglet_height", 320))));
		const samples = Math.max(1, Math.min(4096, Math.floor(readNumber("giglet_samples", 64))));
		const bounces = Math.max(1, Math.min(8, Math.floor(readNumber("giglet_bounces", 3))));
		const camera = buildCamera(triangles);

		renderCanvas.width = width;
		renderCanvas.height = height;
		startButton.disabled = true;
		stopButton.disabled = false;
		setStatus("Building ray scene…");

		const source = workerSource();
		worker = new Worker(URL.createObjectURL(new Blob([source], {type: "text/javascript"})));
		worker.onmessage = event => {
			const data = event.data;
			if (data.type === "frame") {
				const image = new ImageData(new Uint8ClampedArray(data.pixels), width, height);
				renderCanvas.getContext("2d").putImageData(image, 0, 0);
				setStatus("Rendering • sample " + data.sample + " / " + samples);
			} else if (data.type === "done") {
				setStatus("Finished • " + data.sample + " samples.");
				stopRender();
			} else if (data.type === "error") {
				setStatus("Render error: " + data.message);
				stopRender();
			}
		};
		worker.postMessage({triangles, width, height, samples, bounces, camera});
	}

	function workerSource() {
		return `
		const PI = Math.PI;
		const EPS = 0.0001;
		const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
		const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
		const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
		const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
		const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
		const length=a=>Math.sqrt(dot(a,a));
		const normalize=a=>mul(a,1/Math.max(length(a),EPS));
		const max3=a=>Math.max(a[0],a[1],a[2]);
		const clamp=x=>Math.max(0,Math.min(1,x));
		let seed=123456789;
		function rand(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
		function centroid(t){return mul(add(add(t.a,t.b),t.c),1/3);}
		function triBounds(t){
			return {
				min:[Math.min(t.a[0],t.b[0],t.c[0]),Math.min(t.a[1],t.b[1],t.c[1]),Math.min(t.a[2],t.b[2],t.c[2])],
				max:[Math.max(t.a[0],t.b[0],t.c[0]),Math.max(t.a[1],t.b[1],t.c[1]),Math.max(t.a[2],t.b[2],t.c[2])]
			};
		}
		function union(a,b){return {min:[Math.min(a.min[0],b.min[0]),Math.min(a.min[1],b.min[1]),Math.min(a.min[2],b.min[2])],max:[Math.max(a.max[0],b.max[0]),Math.max(a.max[1],b.max[1]),Math.max(a.max[2],b.max[2])]};}
		function hitBox(ray,b,tMax){
			let t0=0,t1=tMax;
			for(let i=0;i<3;i++){
				const inv=1/(ray.d[i]||1e-12);
				let a=(b.min[i]-ray.o[i])*inv,bv=(b.max[i]-ray.o[i])*inv;
				if(inv<0){const q=a;a=bv;bv=q;}
				t0=Math.max(t0,a);t1=Math.min(t1,bv);
				if(t1<=t0)return false;
			}
			return true;
		}
		function build(items){
			if(items.length<=4){
			let b=triBounds(items[0]);for(let i=1;i<items.length;i++)b=union(b,triBounds(items[i]));
			return {b,items};
			}
			let b=triBounds(items[0]);for(let i=1;i<items.length;i++)b=union(b,triBounds(items[i]));
			const extent=sub(b.max,b.min);let axis=0;if(extent[1]>extent[axis])axis=1;if(extent[2]>extent[axis])axis=2;
			items.sort((x,y)=>centroid(x)[axis]-centroid(y)[axis]);
			const mid=items.length>>1;
			return {b,left:build(items.slice(0,mid)),right:build(items.slice(mid))};
		}
		function hitTri(ray,t,maxT){
			const e1=sub(t.b,t.a),e2=sub(t.c,t.a),p=cross(ray.d,e2),det=dot(e1,p);
			if(Math.abs(det)<EPS)return null;
			const inv=1/det,s=sub(ray.o,t.a),u=dot(s,p)*inv;
			if(u<0||u>1)return null;
			const q=cross(s,e1),v=dot(ray.d,q)*inv;
			if(v<0||u+v>1)return null;
			const d=dot(e2,q)*inv;
			if(d<EPS||d>maxT)return null;
			return {d, p:add(ray.o,mul(ray.d,d)), n:normalize(cross(e1,e2)), color:t.color};
		}
		function hitNode(node,ray,best){
			if(!hitBox(ray,node.b,best.d))return best;
			if(node.items){
				for(const t of node.items){const h=hitTri(ray,t,best.d);if(h){best=h;}}
				return best;
			}
			best=hitNode(node.left,ray,best);
			best=hitNode(node.right,ray,best);
			return best;
		}
		function cosineHemisphere(n){
			const r1=2*PI*rand(),r2=rand(),r2s=Math.sqrt(r2);
			const w=n;
			const u=normalize(cross(Math.abs(w[0])>0.1?[0,1,0]:[1,0,0],w));
			const v=cross(w,u);
			return normalize(add(add(mul(u,Math.cos(r1)*r2s),mul(v,Math.sin(r1)*r2s)),mul(w,Math.sqrt(1-r2))));
		}
		function cameraRay(x,y,camera,width,height){
			const forward=normalize(sub(camera.target,camera.position));
			const right=normalize(cross(forward,[0,1,0]));
			const up=normalize(cross(right,forward));
			const aspect=width/height,scale=Math.tan(camera.fov*PI/360);
			const px=((x+rand())/width*2-1)*aspect*scale;
			const py=(1-(y+rand())/height*2)*scale;
			return {o:camera.position,d:normalize(add(forward,add(mul(right,px),mul(up,py))))};
		}
		function sky(d){const t=0.5*(d[1]+1);return [0.08*(1-t)+0.32*t,0.10*(1-t)+0.48*t,0.15*(1-t)+0.78*t];}
		function trace(ray,bvh,bounces){
			let radiance=[0,0,0],throughput=[1,1,1];
			for(let bounce=0;bounce<bounces;bounce++){
				const h=hitNode(bvh,ray,{d:Infinity});
				if(!h){const s=sky(ray.d);radiance=add(radiance,[throughput[0]*s[0],throughput[1]*s[1],throughput[2]*s[2]]);break;}
				const lightDir=normalize([0.55,0.85,0.35]);
				const shadowOrigin=add(h.p,mul(h.n,EPS*8));
				const shadow=hitNode(bvh,{o:shadowOrigin,d:lightDir},{d:Infinity});
				const ndl=Math.max(0,dot(h.n,lightDir));
				const direct=shadow.d===Infinity?ndl:0.05*ndl;
				throughput=[throughput[0]*h.color[0],throughput[1]*h.color[1],throughput[2]*h.color[2]];
				radiance=add(radiance,mul(throughput,direct));
				ray={o:shadowOrigin,d:cosineHemisphere(h.n)};
				if(bounce>1){const q=Math.max(throughput[0],throughput[1],throughput[2]);if(rand()>Math.min(0.95,q)){break;}throughput=mul(throughput,1/Math.max(q,0.05));}
			}
			return radiance;
		}
		self.onmessage=e=>{
			try{
				const {triangles,width,height,samples,bounces,camera}=e.data;
				const bvh=build(triangles.slice());
				const accum=new Float32Array(width*height*3);
				for(let s=1;s<=samples;s++){
					for(let y=0;y<height;y++)for(let x=0;x<width;x++){
						const c=trace(cameraRay(x,y,camera,width,height),bvh,bounces);
						const i=(y*width+x)*3;accum[i]+=c[0];accum[i+1]+=c[1];accum[i+2]+=c[2];
					}
					if(s===1||s%1===0){
						const pixels=new Uint8ClampedArray(width*height*4);
						for(let i=0,p=0;i<accum.length;i+=3,p+=4){
							const inv=1/s;
							pixels[p]=255*Math.pow(clamp(accum[i]*inv),1/2.2);
							pixels[p+1]=255*Math.pow(clamp(accum[i+1]*inv),1/2.2);
							pixels[p+2]=255*Math.pow(clamp(accum[i+2]*inv),1/2.2);
							pixels[p+3]=255;
						}
						self.postMessage({type:"frame",sample:s,pixels},[pixels.buffer]);
					}
				}
				self.postMessage({type:"done",sample:samples});
			}catch(err){self.postMessage({type:"error",message:String(err&&err.stack||err)});}}
		};
		`;
	}
})();