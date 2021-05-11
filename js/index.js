    import * as THREE from 'three';
import {
    OrbitControls
} from 'three/examples/jsm/controls/OrbitControls';
import {
    FBXLoader
} from 'three/examples/jsm/loaders/FBXLoader';

import model from '../3dModels/Model3D.fbx';
import animKnee from '../3dModels/animKnee.fbx';



class Game {
    constructor() {

        this.player = {};
        this.animations = {};
        this.container;
        this.stats;
        this.controls;
        this.scene;
        this.camera;
        this.renderer;

        this.container = document.createElement("div");
        this.container.style.height = "100%";
        document.body.appendChild(this.container);
        const game = this;

        this.anims = ['Pointing Gesture'];
        this.clock = new THREE.Clock();

        this.init();


    }

    init() {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
        this.camera.position.set(100, 100, 400);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xa0a0a0);
        this.scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

        let light = new THREE.DirectionalLight(0xffffff);
        light.position.set(0, 200, 100);
        light.castShadow = true;
        light.shadow.camera.top = 180;
        light.shadow.camera.bottom = -100;
        light.shadow.camera.left = -120;
        light.shadow.camera.right = 120;
        this.scene.add(light);

        var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(4000, 4000), new THREE.MeshPhongMaterial({
            color: 0x999999,
            depthWrite: false
        }));
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        var grid = new THREE.GridHelper(4000, 60, 0x000000, 0x000000);
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        this.scene.add(grid);

        const loader = new FBXLoader();
        const game = this;

        const tloader = new THREE.TextureLoader();

        loader.load(model, function (object) {
            object.mixer = new THREE.AnimationMixer(object);
            game.player.mixer = object.mixer;
            game.player.root = object.mixer.getRoot();
            console.log(object);

            object.name = "ff";

            object.traverse(function (child) {
                if (child.isMesh) {
                    child.material.map = null;
                    child.castShadow = true;
                    child.receiveShadow = false;
                }
            });

            // tloader.load(texture, function(texture){
            //     object.traverse(function (child) {
            //         if (child.isMesh) {
            //             child.material.map = texture;
            //         }
            //     });
            // });

            game.scene.add(object);
            game.player.object = object;
            // game.player.mixer.clipAction(object.animations[0]).play();
            game.animations.Idle = object.animations[0];
            game.loadNextAnim(loader);
            // game.animate();

        })

        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 150, 0);
        this.controls.update();

        window.addEventListener("resize", function () {
            game.onWindowResize();
        }, false);

        window.addEventListener("click", function(){
            game.toggleAnimation();
        }, false)

    }

    loadNextAnim(loader){
        let anim = this.anims.pop();
        const game = this;
        loader.load(animKnee,function(object){
            game.animations[anim] = object.animations[0];
            if(game.anims.length > 0){
                game.loadNextAnim(loader);
            }else{
                delete game.anims;
                game.action = 'Idle';
                game.animate();
            }
        })
    }

    set action(name){
        const action = this.player.mixer.clipAction(this.animations[name]);
        action.time = 0;
        this.player.mixer.stopAllAction();
        this.player.action = name;
        this.player.actionTime = Date.now();
        this.player.actionName = name;

        action.fadeIn(0.5);
        action.play();
    }
    get action(){
        if(this.player === undefined || this.player.actionName === undefined) return "";
        return this.player.actionName;
    }

    toggleAnimation(){
        if(game.action == "Idle"){
            game.action = "Pointing Gesture";
        }else{
            game.action = "Idle";
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        const game = this;
        const dt = this.clock.getDelta();
        requestAnimationFrame(function () {
            game.animate()
        });

        if (this.player.mixer !== undefined) {
            this.player.mixer.update(dt);
        }

        this.renderer.render(this.scene, this.camera);
    }
}


var game = new Game();