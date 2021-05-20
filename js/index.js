    import * as THREE from 'three';
    import {
        OrbitControls
    } from 'three/examples/jsm/controls/OrbitControls';
    import {
        GLTFLoader
    } from 'three/examples/jsm/loaders/GLTFLoader';

    import spiderGLTF from '../3dModels/spider2.glb';


    import spiderBase from '../3dModels/textures/base.png';
    import spiderNormal from '../3dModels/textures/normal.png';
    import spiderMetalness from '../3dModels/textures/metalness.png';
    import spiderRoughness from '../3dModels/textures/roughness.png';
    import spiderHeight from '../3dModels/textures/height.png';


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

            this.crossFadeDuration = 0.3;

            this.container = document.createElement("div");
            this.container.style.height = "100%";
            document.body.appendChild(this.container);
            const game = this;

            this.clock = new THREE.Clock();

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
            this.camera.position.set(100, 100, 100);

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xdedede);
            this.scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

            let ambientLight = new THREE.AmbientLight(0xffffff);
            this.scene.add(ambientLight);

            let light = new THREE.DirectionalLight(0xffffff);
            light.position.set(10, 20, 20);
            light.castShadow = true;
            light.shadow.camera.top = 180;
            light.shadow.camera.bottom = -100;
            light.shadow.camera.left = -120;
            light.shadow.camera.right = 120;
            this.scene.add(light);
            this.sun = light;

            var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(1000, 1000), new THREE.MeshPhongMaterial({
                color: 0x666666,
                depthWrite: false
            }));
            mesh.rotation.x = -Math.PI / 2;
            mesh.receiveShadow = true;
            this.scene.add(mesh);

            var grid = new THREE.GridHelper(1000, 60, 0x000000, 0x000000);
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
                        console.log(child.material);

                        let base = tloader.load(spiderBase);
                        base.flipY = false;
                        let metal = tloader.load(spiderMetalness);
                        metal.flipY = false;
                        let rough = tloader.load(spiderRoughness);
                        rough.flipY = false;
                        let norm = tloader.load(spiderNormal);
                        norm.flipY = false;
                          
                        child.material.map = base;
                        child.material.metalnessMap = metal;
                        child.material.roughnessMap = rough;
                        child.material.normalMap = norm;

                        child.material.metalness = 0.8;
                        child.material.roughness = 0.6;


                        child.castShadow = true;
                        child.receiveShadow = false;
                    }
                });

                let idle = game.player.mixer.clipAction(object.animations[0]);
                let walk = game.player.mixer.clipAction(object.animations[2]);
                let walkBack = game.player.mixer.clipAction(object.animations[3]);
                let walkRight = game.player.mixer.clipAction(object.animations[4]);
                let jump = game.player.mixer.clipAction(object.animations[1]);

                jump.repetitions = 1;

                console.log(object.animations);
                game.player.actions = [idle, walk, walkBack, walkRight, jump];
                game.activateAllActions();

                game.idleAction = game.player.actions[0];
                game.walkAction = game.player.actions[1];
                game.walkBackAction = game.player.actions[2];
                game.walkRightAction = game.player.actions[3];
                game.jumpAction = game.player.actions[4];


                game.walkAction.weight = 0;
                game.walkBackAction.weight = 0;
                game.walkRightAction.weight = 0;
                game.jumpAction.weight = 0;


                game.player.action = "Idle";
                game.animate();

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
                if (this.player.action == "Idle") {
                    this.executeCrossFade(this.player.actions[0], this.player.actions[3], this.crossFadeDuration);
                }
                if (this.player.action == "WALK") {
                    this.executeCrossFade(this.player.actions[1], this.player.actions[3], this.crossFadeDuration);
                }
            } else if (event.keyCode == 37) {
                this.leftPressed = true;
                if (this.player.action == "Idle") {
                    this.executeCrossFade(this.player.actions[0], this.player.actions[3], this.crossFadeDuration);
                }
                if (this.player.action == "WALK") {
                    this.executeCrossFade(this.player.actions[1], this.player.actions[3], this.crossFadeDuration);
                }
            }
            if (event.keyCode == 40) {
                this.downPressed = true;
                if (this.player.action == "Idle") {
                    this.executeCrossFade(this.player.actions[0], this.player.actions[2], this.crossFadeDuration);
                }
            } else if (event.keyCode == 38) {
                this.upPressed = true;
                if (this.player.action == "Idle") {
                    this.executeCrossFade(this.player.actions[0], this.player.actions[1], this.crossFadeDuration);
                }
            }

            if (event.keyCode == 32) {
                this.jumpPressed = true;
                if (this.player.action == "Idle") {
                    this.player.mixer.addEventListener('finished', onLoopFinished);
                    this.setWeight(this.player.actions[4], 1);
                    this.player.actions[4].time = 0;
                    this.player.actions[0].crossFadeTo(this.player.actions[4], game.crossFadeDuration, true);

                    function onLoopFinished(event) {
                            game.player.mixer.removeEventListener('finished', onLoopFinished);
                            game.executeCrossFade(game.player.actions[4], game.player.actions[0], game.crossFadeDuration);
                    }
                }
            }
        }

        keyUpHandler(event) {

            if (event.keyCode == 39) {
                this.rightPressed = false;
                if (this.player.action == "WALK RIGHT") {
                    this.executeCrossFade(this.player.actions[3], this.player.actions[0], this.crossFadeDuration);
                }
            } else if (event.keyCode == 37) {
                this.leftPressed = false;
                if (this.player.action == "WALK RIGHT") {
                    this.executeCrossFade(this.player.actions[3], this.player.actions[0], this.crossFadeDuration);
                }
            }
            if (event.keyCode == 40) {
                this.downPressed = false;
                if (this.player.action == "WALK BACK") {
                    this.executeCrossFade(this.player.actions[2], this.player.actions[0], this.crossFadeDuration);
                }
            } else if (event.keyCode == 38) {
                this.upPressed = false;
                if (this.player.action == "WALK") {
                    this.executeCrossFade(this.player.actions[1], this.player.actions[0], this.crossFadeDuration);
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

            var dir = new THREE.Vector3(0, 0, -0.8);
            dir.applyQuaternion(this.spider.quaternion);

            if (this.rightPressed) {
                this.spider.rotation.y -= Math.PI / 200;
            } else if (this.leftPressed) {
                this.spider.rotation.y += Math.PI / 200;
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