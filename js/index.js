    import * as THREE from 'three';
    import {
        OrbitControls
    } from 'three/examples/jsm/controls/OrbitControls';
    import {
        GLTFLoader
    } from 'three/examples/jsm/loaders/GLTFLoader';

    import spiderGLTF from '../3dModels/spider.glb';


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

            this.clock = new THREE.Clock();

            this.idleToWalk = this.idleToWalk.bind(this);
            this.walkToIdleTo = this.walkToIdleTo.bind(this);

            this.synchronizeCrossFade = this.synchronizeCrossFade.bind(this);
            this.executeCrossFade = this.executeCrossFade.bind(this);
            this.keyDownHandler = this.keyDownHandler.bind(this);
            this.keyUpHandler = this.keyUpHandler.bind(this);

            document.addEventListener('keydown', this.keyDownHandler, false);
            document.addEventListener('keyup', this.keyUpHandler, false);


            this.upPressed = false;
            this.downPressed = false;
            this.leftPressed = false;
            this.rightPressed = false;

            this.walking = false;
            this.idleing = true;

            this.init();
        }

        idleToWalk() {
            this.prepareCrossFade(this.player.actions[0], this.player.actions[1], 0.5);
        }

        walkToIdleTo() {
            this.prepareCrossFade(this.player.actions[1], this.player.actions[0], 0.5);
        }


        addButtons() {
            let game = this;
            let idleBtn = document.createElement("button");
            let walkBtn = document.createElement("button");
            let buttonWrapper = document.createElement("div");
            buttonWrapper.className = "buttons_wrapper";
            idleBtn.innerText = "idle to walk";
            walkBtn.innerText = "walk to idle";

            buttonWrapper.appendChild(idleBtn);
            buttonWrapper.appendChild(walkBtn);
            document.body.appendChild(buttonWrapper);

            idleBtn.addEventListener("click", game.idleToWalk);
            walkBtn.addEventListener("click", game.walkToIdleTo);
        }

        prepareCrossFade(startAction, endAction, defaultDuration) {

            const duration = defaultDuration;

            if (startAction === this.player.actions[0]) {

                this.executeCrossFade(startAction, endAction, duration);

            } else {

                this.synchronizeCrossFade(startAction, endAction, duration);

            }

        }

        executeCrossFade(startAction, endAction, duration) {
            this.setWeight(endAction, 1);
            endAction.time = 0;
            startAction.crossFadeTo(endAction, duration, true);
            this.player.action = endAction._clip.name;
            console.log(this.player);
        }

        synchronizeCrossFade(startAction, endAction, duration) {
            let game = this;
            this.player.mixer.addEventListener('loop', onLoopFinished);

            function onLoopFinished(event) {

                if (event.action === startAction) {

                    game.player.mixer.removeEventListener('loop', onLoopFinished);

                    game.executeCrossFade(startAction, endAction, duration);

                }

            }

        }

        setWeight(action, weight) {

            action.enabled = true;
            action.setEffectiveTimeScale(1);
            action.setEffectiveWeight(weight);

        }

        init() {
            this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
            this.camera.position.set(100, 100, 400);

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xa0a0a0);
            this.scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

            let light = new THREE.DirectionalLight(0xffffff);
            light.position.set(-10, 20, 20);
            light.castShadow = true;
            light.shadow.camera.top = 180;
            light.shadow.camera.bottom = -100;
            light.shadow.camera.left = -120;
            light.shadow.camera.right = 120;
            this.scene.add(light);
            this.sun = light;

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

            const loader = new GLTFLoader();
            const game = this;

            const tloader = new THREE.TextureLoader();

            loader.load(spiderGLTF, function (object) {

                game.spider = object.scene;

                object.mixer = new THREE.AnimationMixer(game.spider);
                game.player.mixer = object.mixer;
                // game.player.root = object.mixer.getRoot();
                game.spider.scale.set(10, 10, 10);
                game.spider.position.setY(-2.5);
                game.scene.add(game.spider);

                game.sun.parent = game.spider;
                game.sun.target = game.spider;

                

                game.spider.traverse(function (child) {
                    if (child.isMesh) {
                        child.material.map = null;
                        child.castShadow = true;
                        child.receiveShadow = false;
                    }
                });

                let idle = game.player.mixer.clipAction(object.animations[1]);
                let walk = game.player.mixer.clipAction(object.animations[2]);
                let walkBack = game.player.mixer.clipAction(object.animations[2]);
                walkBack.timeScale = -1;
                // let jump = game.player.mixer.clipAction(animations[1]);
                game.player.actions = [idle, walk, walkBack];
                game.activateAllActions();
                game.walkToIdleTo();
                game.animate();
                console.log(game);
            })

            this.renderer = new THREE.WebGLRenderer({
                antialias: true
            });
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.container.appendChild(this.renderer.domElement);

            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.target.set(0, 10, 0);
            this.controls.update();

            window.addEventListener("resize", function () {
                game.onWindowResize();
            }, false);


        }

        activateAllActions() {

            // setWeight( idleAction, settings[ 'modify idle weight' ] );
            // setWeight( walkAction, settings[ 'modify walk weight' ] );
            // setWeight( runAction, settings[ 'modify run weight' ] );

            this.player.actions.forEach(function (action) {
                action.play();
            });

        }


        onWindowResize() {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }


        keyDownHandler(event) {
            
            if (event.keyCode == 39) {
                this.rightPressed = true;
            } else if (event.keyCode == 37) {
                this.leftPressed = true;
            }
            if (event.keyCode == 40) {
                this.downPressed = true;
                if(this.player.action == "Idle" && this.player.action !== "WALK"){
                    this.executeCrossFade(this.player.actions[0],this.player.actions[2],0.5);
                    console.log(this.player.action);
                }
            } else if (event.keyCode == 38) {
                this.upPressed = true;
                if(this.player.action == "Idle" && this.player.action !== "WALK"){
                    this.executeCrossFade(this.player.actions[0],this.player.actions[1],0.5);
                    console.log(this.player.action);
                }
            }
        }

        keyUpHandler(event) {
            
            if (event.keyCode == 39) {
                this.rightPressed = false;
            } else if (event.keyCode == 37) {
                this.leftPressed = false;
            }
            if (event.keyCode == 40) {
                this.downPressed = false;
            } else if (event.keyCode == 38) {
                this.upPressed = false;
                if(this.player.action == "WALK" && this.player.action !== "Idle"){
                    this.executeCrossFade(this.player.actions[1],this.player.actions[0],0.5);
                    console.log(this.player.action);
                }
            }
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

            var dir = new THREE.Vector3( 0, 0, -1 );
            dir.applyQuaternion( this.spider.quaternion );

            if (this.rightPressed) {
                this.spider.rotation.y -= Math.PI / 100;
            } else if (this.leftPressed) {
                this.spider.rotation.y += Math.PI / 100;
            }
            if (this.downPressed) {
                this.spider.position.add(dir);
            } else if (this.upPressed) {
                
                this.spider.position.sub(dir);
            }

            this.renderer.render(this.scene, this.camera);
        }
    }


    var game = new Game();