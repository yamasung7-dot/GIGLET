/* GIGLET Lighting 4.0.0 - regular viewport lighting controlled by a movable Blockbench locator. */
(function () {
const ID="giglet_render", SIZE=4, COLOR=0xffffff;
let menuAction,createAction,colorAction,sizeAction,removeAction,colorDialog;
let light=null,billboard=null,billboardMaterial=null,controller=null,lightSize=SIZE,lightColor=COLOR;
let renderListener=null;

Plugin.register(ID,{
 title:"GIGLET Lighting",author:"Olive",
 description:"Create a regular point light controlled by a movable Blockbench light object.",
 version:"4.0.0",min_version:"4.8.0",variant:"both",
 onload(){
  createAction=new Action("giglet_create_light",{name:"Create Light Billboard",icon:"lightbulb",click:createLight});
  colorAction=new Action("giglet_light_color",{name:"Light Color",icon:"colorize",condition:()=>!!light,click:openColorMenu});
  sizeAction=new Action("giglet_light_size",{name:"Light Size",icon:"aspect_ratio",condition:()=>!!light,click:changeSize});
  removeAction=new Action("giglet_remove_light",{name:"Remove Light",icon:"delete",condition:()=>!!light,click:removeLight});

  menuAction=new Action("giglet_lighting",{
   name:"GIGLET Lighting",
   icon:"lightbulb_outline",
   click:e=>new Menu("giglet_lighting_menu",[
    createAction,colorAction,sizeAction,removeAction
   ]).open(e&&e.target?e.target:document.body)
  });
  MenuBar.addAction(menuAction,"tools");

  renderListener=syncLightToController;
  Blockbench.on("render_frame",renderListener);
 },
 onunload(){
  if(renderListener)Blockbench.removeListener("render_frame",renderListener);
  removeLight();
  if(colorDialog)colorDialog.hide();
  [menuAction,createAction,colorAction,sizeAction,removeAction].forEach(a=>{if(a)a.delete()});
 }
});

function createLight(){
 if(light){Blockbench.showQuickMessage("GIGLET light already exists.");return}
 if(typeof Canvas==="undefined"||!Canvas.scene){Blockbench.showQuickMessage("GIGLET could not access the Blockbench viewport scene.");return}
 if(typeof Locator==="undefined"){Blockbench.showQuickMessage("GIGLET requires Blockbench locators.");return}

 lightSize=SIZE;
 lightColor=COLOR;

 // The Locator is the actual editable Blockbench object.
 controller=new Locator({
  name:"GIGLET Light",
  position:[8,10,8],
  visibility:true,
  export:false
 }).init();

 // Keep the controller at the project root so its transform is world-space.
 controller.addTo(Outliner.ROOT);
 controller.export=false;
 controller.createUniqueName();

 light=new THREE.PointLight(lightColor,1,Math.max(20,lightSize*20),2);
 light.no_export=true;

 billboardMaterial=new THREE.SpriteMaterial({
  color:lightColor,
  transparent:true,
  opacity:.82,
  depthWrite:false,
  depthTest:false
 });

 billboard=new THREE.Sprite(billboardMaterial);
 billboard.name="GIGLET Light Billboard";
 billboard.scale.set(lightSize,lightSize,1);
 billboard.renderOrder=1000;
 billboard.no_export=true;

 // The billboard follows the Blockbench light object.
 controller.mesh.add(billboard);

 // Hide Blockbench's tiny default locator marker so the GIGLET billboard is the
 // visible representation. The Locator itself remains a normal movable object.
 if(controller.mesh.sprite){
  controller.mesh.sprite.material.transparent=true;
  controller.mesh.sprite.material.opacity=0;
 }

 light.userData.giglet_controller=controller;
 billboard.userData.giglet_light=light;
 controller.userData.giglet_light=light;
 controller.userData.giglet_billboard=billboard;

 Canvas.scene.add(light);
 updateLightFromController();
 controller.select();

 Blockbench.showQuickMessage("GIGLET light created — move it like a model.");
}

function syncLightToController(){
 if(!light||!controller)return;

 // If the user deletes the light object from the Outliner, remove the viewport light too.
 if(!Locator.all.includes(controller)){
  removeLight(false);
  return;
 }

 const worldPosition=controller.getWorldCenter();
 if(!light.position.equals(worldPosition)){
  light.position.copy(worldPosition);
 }
 updateBillboard();
}

function updateLightFromController(){
 if(!light||!controller)return;
 light.position.copy(controller.getWorldCenter());
 updateLightSettings();
 updateBillboard();
}

function updateLightSettings(){
 if(!light)return;

 const area=Math.max(.01,lightSize*lightSize);
 const power=Math.min(100000,area*12);

 if("power" in light)light.power=power;
 else light.intensity=Math.min(10,power/100);

 light.distance=Math.max(20,lightSize*20);
 light.decay=2;
 light.color.setHex(lightColor);
}

function updateBillboard(){
 if(!billboard)return;
 billboard.scale.set(lightSize,lightSize,1);
 if(billboardMaterial)billboardMaterial.color.setHex(lightColor);
}

function openColorMenu(e){
 const colors=[
  ["White",0xffffff],
  ["Warm White",0xffd7a8],
  ["Cool White",0xc9ddff],
  ["Red",0xff4040],
  ["Orange",0xff8a3d],
  ["Yellow",0xffe44d],
  ["Green",0x57d66b],
  ["Cyan",0x43d9ff],
  ["Blue",0x4f7cff],
  ["Purple",0xa66cff],
  ["Pink",0xff6fcf]
 ];

 const items=colors.map(c=>({
  name:c[0],
  icon:"fiber_manual_record",
  click:()=>setColor(c[1])
 }));

 items.push({name:"Custom Color...",icon:"colorize",click:openCustomColor});
 new Menu("giglet_light_colors",items).open(e&&e.target?e.target:document.body);
}

function setColor(c){
 if(!light)return;
 lightColor=c;
 updateLightSettings();
 updateBillboard();
}

function openCustomColor(){
 const current="#"+lightColor.toString(16).padStart(6,"0");

 if(!colorDialog){
  colorDialog=new Dialog({
   id:"giglet_light_color_dialog",
   title:"GIGLET Light Color",
   form:{
    color:{label:"Color",type:"color",value:current}
   },
   onConfirm(form){
    if(!light)return;
    const v=String(form.color||"").replace("#","");
    if(/^[0-9a-fA-F]{6}$/.test(v))setColor(parseInt(v,16));
   }
  });
 }

 colorDialog.show();
}

function changeSize(){
 if(!light)return;

 new Dialog({
  id:"giglet_light_size_dialog",
  title:"GIGLET Light Size",
  form:{
   size:{label:"Billboard Size",type:"number",value:lightSize,min:.1,max:100,step:.1}
  },
  onConfirm(form){
   if(!light)return;
   const v=Number(form.size);
   if(Number.isFinite(v)){
    lightSize=Math.max(.1,Math.min(100,v));
    updateLightSettings();
    updateBillboard();
   }
  }
 }).show();
}

function removeLight(removeController=true){
 if(controller){
  if(controller.mesh&&billboard&&billboard.parent===controller.mesh){
   controller.mesh.remove(billboard);
  }
  if(removeController&&Locator.all.includes(controller)&&controller.remove){
   controller.remove();
  }
 }

 if(billboardMaterial)billboardMaterial.dispose();
 if(light&&light.parent)light.parent.remove(light);

 billboard=null;
 billboardMaterial=null;
 controller=null;
 light=null;
}

})();
