/*
 * GIGLET Render 2.0.0
 * Regular Three.js lighting renderer.
 *
 * The renderer is intentionally simple: Blockbench geometry is copied into
 * an isolated Three.js scene, lit normally, and rendered to a canvas.
 * Each light is represented by a camera-facing billboard. Billboard area
 * controls both the visual light size and its power.
 */
(function () {
	const PLUGIN_ID = "giglet_render";
	let action;
	let dialog;
	let renderer;
	let renderScene;
	let camera;
	let renderCanvas;
	let status;

	Plugin.register(PLUGIN_ID, {
		title: "GIGLET Render",
		author: "Olive",
		description: "A lightweight Blockbench renderer with billboard-sized lights.",
		version: "2.0.0",
		min_version: "4.8.0",
		variant: "both",
		onload() {
			action = new Action("giglet_render_open", {
			name: "GIGLET Render",
			icon: "photo_camera",
			description: "Open the GIGLET regular-lighting renderer.",
			click: open
		});
		MenuBar.addAction(action, "tools");
	},
		onunload() {
		if (renderer) renderer.dispose();
		if (dialog) dialog.hide();
		if (action) action.delete();
	}
	});

	function open() {
		if (!dialog) createDialog();
		dialog.show();
	}

	function createDialog() {
		const template = `
		<div style="display:flex;flex-direction:column;height:100%;gap:8px;">
			<div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;">
				<label>Width <input id="giglet_w" type="number" min="128" max="2048" value="640" style="width:65px"></label>
				<label>Height <input id="giglet_h" type="number" min="128" max="2048" value="640" style="width:65px"></label>
				<label>Light size <input id="giglet_size" type="number" min="0.1" max="100" step="0.1" value="4" style="width:55px"></label>
				<label>Light X <input id="giglet_x" type="number" step="0.1" value="8" style="width:55px"></label>
				<label>Y <input id="giglet_y" type="number" step="0.1" value="10" style="width:55px"></label>
				<label>Z <input id="giglet_z" type="number" step="0.1" value="8" style="width:55px"></label>
				<button id="giglet_render">Render</button>
				<button id="giglet_save">Save PNG</button>
			</div>
			<div id="giglet_status">Ready.</div>
			<div style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:#181818;overflow:auto;">
				<canvas id="giglet_canvas" style="max-width:100%;max-height:100%;"></canvas>
			</div>
		</div>`;

		dialog = new Dialog({
			id: "giglet_render_dialog",
			title: "GIGLET Render",
			width: 820,
			height: 760,
			component: { template }
		});
		dialog.onOpen = () => {
			renderCanvas = document.getElementById("giglet_canvas");
			status = document.getElementById("giglet_status");
			document.getElementById("giglet_render").onclick = render;
			document.getElementById("giglet_save").onclick = save;
		};
	}

	function num(id, fallback) {
		const n = Number(document.getElementById(id)?.value);
		return Number.isFinite(n) ? n : fallback;
	}

	function setStatus(message) {
		if (status) status.textContent = message;
	}

	function getBounds(root) {
		const box = new THREE.Box3().setFromObject(root);
		if (box.isEmpty()) return null;
		return box;
	}

	function collectModel(scene) {
		let source = null;
		if (typeof Preview !== "undefined" && Preview.selected && Preview.selected.scene) {
			source = Preview.selected.scene;
		}
		if (!source) {
			source = new THREE.Group();
			if (typeof Outliner !== "undefined" && Outliner.elements) {
				for (const element of Outliner.elements) {
					if (element.mesh && element.visibility !== false) {
						source.add(element.mesh.clone(true));
					}
				}
			}
		}
		const model = new THREE.Group();
		model.name = "GIGLET_Model";
		source.updateMatrixWorld(true);
		source.traverse(object => {
			if (!object.isMesh || !object.visible || !object.geometry) return;
			const clone = object.clone(true);
			clone.material = Array.isArray(object.material)
				? object.material.map(material => material && material.clone ? material.clone() : material)
				: (object.material && object.material.clone ? object.material.clone() : object.material);
			model.add(clone);
		});
		if (!model.children.length && source.isMesh) model.add(source.clone(true));
		scene.add(model);
		return model;
	}

	function makeBillboard(size, color) {
		const group = new THREE.Group();
		const material = new THREE.MeshBasicMaterial({
			color,
			transparent: true,
			opacity: 0.7,
			depthWrite: false,
			side: THREE.DoubleSide
		});
		const geometry = new THREE.PlaneGeometry(size, size);
		const billboard = new THREE.Mesh(geometry, material);
		billboard.name = "GIGLET_Light_Billboard";
		group.add(billboard);
		group.userData.billboard = billboard;
		return group;
	}

	function setupLight(scene, size, x, y, z) {
		const safeSize = Math.max(0.1, size);
		// Billboard area controls the light power. Larger billboard = stronger light.
		const area = safeSize * safeSize;
		const power = Math.min(100000, area * 12);
		const light = new THREE.PointLight(0xffffff, 1, Math.max(20, safeSize * 20), 2);
		if ("power" in light) light.power = power;
		light.position.set(x, y, z);
		light.castShadow = true;
		light.shadow.mapSize.set(1024, 1024);

		const billboard = makeBillboard(safeSize, 0xfff1c7);
		billboard.position.copy(light.position);
		billboard.userData.light = light;
		light.userData.billboard = billboard;
		scene.add(light);
		scene.add(billboard);
		return light;
	}

	function aimBillboard(billboard, cam) {
		billboard.lookAt(cam.position);
	}

	function buildCamera(model, width, height) {
		const box = getBounds(model);
		if (!box) return null;
		const center = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3());
		const radius = Math.max(size.x, size.y, size.z, 1);
		const cam = new THREE.PerspectiveCamera(45, width / height, 0.01, radius * 100);
		cam.position.set(center.x + radius * 2.4, center.y + radius * 1.5, center.z + radius * 2.4);
		cam.lookAt(center.x, center.y + size.y * 0.08, center.z);
		return cam;
	}

	function render() {
		try {
			const width = Math.max(128, Math.min(2048, Math.floor(num("giglet_w", 640))));
			const height = Math.max(128, Math.min(2048, Math.floor(num("giglet_h", 640))));
			const size = Math.max(0.1, Math.min(100, num("giglet_size", 4)));
			const x = num("giglet_x", 8);
			const y = num("giglet_y", 10);
			const z = num("giglet_z", 8);

			if (!renderer) {
				renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
			}
			renderer.setPixelRatio(1);
			renderer.setSize(width, height, false);
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;
			renderer.outputColorSpace = THREE.SRGBColorSpace || renderer.outputColorSpace;

			renderScene = new THREE.Scene();
			renderScene.background = new THREE.Color(0.045, 0.055, 0.07);

			const model = collectModel(renderScene);
			if (!model.children.length) {
				setStatus("No renderable model geometry found.");
				return;
			}

			camera = buildCamera(model, width, height);
			if (!camera) {
				setStatus("Could not frame the model.");
				return;
			}

			// Small ambient contribution keeps unlit faces from becoming pure black.
			renderScene.add(new THREE.HemisphereLight(0xbfd8ff, 0x202020, 0.35));

			const key = setupLight(renderScene, size, x, y, z);
			const fill = new THREE.DirectionalLight(0xffffff, 0.35);
			fill.position.set(-4, 6, -5);
			renderScene.add(fill);

			// The billboard is camera-facing, but its world position remains the light position.
			aimBillboard(key.userData.billboard, camera);

			renderer.render(renderScene, camera);
			if (renderCanvas) {
				renderCanvas.width = width;
				renderCanvas.height = height;
				const ctx = renderCanvas.getContext("2d");
				ctx.clearRect(0, 0, width, height);
				ctx.drawImage(renderer.domElement, 0, 0);
			}
			setStatus("Rendered with regular Three.js lighting • billboard size " + size + " • power " + Math.round(key.power));
		} catch (error) {
			setStatus("Render error: " + String(error && error.message || error));
		}
	}

	function save() {
		if (!renderCanvas || renderCanvas.width < 2) {
			setStatus("Render something first.");
			return;
		}
		renderCanvas.toBlob(blob => {
			if (!blob) return;
			Blockbench.export({
				resource_id: "giglet_render.png",
				type: "image",
				content: blob
			});
		});
	}
})();