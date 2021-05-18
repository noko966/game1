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

            this.anims = ['walk'];
            this.clock = new THREE.Clock();

            this.idleToWalk = this.idleToWalk.bind(this);
            this.walkToIdleTo = this.walkToIdleTo.bind(this);

            this.synchronizeCrossFade = this.synchronizeCrossFade.bind(this);
            this.executeCrossFade = this.executeCrossFade.bind(this);



            this.init();

        }

        idleToWalk(){
            this.prepareCrossFade( this.player.actions[1], this.player.actions[0], 1.0 );
        }

        walkToIdleTo(){
            this.prepareCrossFade( this.player.actions[0], this.player.actions[1], 1.0 );
        }


        addButtons(){
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

        prepareCrossFade( startAction, endAction, defaultDuration ) {

            const duration = defaultDuration;

            if ( startAction === this.player.actions[0] ) {

                this.executeCrossFade( startAction, endAction, duration );

            } else {

                this.synchronizeCrossFade( startAction, endAction, duration );

            }

        }

        executeCrossFade( startAction, endAction, duration ) {
            this.setWeight( endAction, 1 );
            endAction.time = 0;
            startAction.crossFadeTo( endAction, duration, true );

        }

        synchronizeCrossFade( startAction, endAction, duration ) {
            let game = this;
            this.player.mixer.addEventListener( 'loop', onLoopFinished );

            function onLoopFinished( event ) {

                if ( event.action === startAction ) {

                    game.player.mixer.removeEventListener( 'loop', onLoopFinished );

                    game.executeCrossFade( startAction, endAction, duration );

                }

            }

        }

        setWeight( action, weight ) {

            action.enabled = true;
            action.setEffectiveTimeScale( 1 );
            action.setEffectiveWeight( weight );

        }

        init() {
            this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
            this.camera.position.set(100, 100, 400);

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xa0a0a0);
            this.scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

            let light = new THREE.DirectionalLight(0xffffff);
            light.position.set(0, 50, 50);
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

            const loader = new GLTFLoader();
            const game = this;

            const tloader = new THREE.TextureLoader();

            loader.load(spiderGLTF, function (object) {
                const spider = object.scene;
                console.log(object);
                object.mixer = new THREE.AnimationMixer(spider);
                game.player.mixer = object.mixer;
                // game.player.root = object.mixer.getRoot();
                spider.scale.set(10, 10, 10);
                game.scene.add(spider);

                spider.traverse(function (child) {
                    if (child.isMesh) {
                        child.material.map = null;
                        child.castShadow = true;
                        child.receiveShadow = false;
                    }
                });

                let idle = game.player.mixer.clipAction(object.animations[1]);
                let walk = game.player.mixer.clipAction(object.animations[2]);
                // let jump = game.player.mixer.clipAction(animations[1]);

                game.player.actions = [idle, walk];

                game.activateAllActions();

                // walk.play();


                // game.player.actions[0].play();

                // tloader.load(texture, function(texture){
                //     object.traverse(function (child) {
                //         if (child.isMesh) {
                //             child.material.map = texture;
                //         }
                //     });
                // });


                // game.player.object = object;
                // game.player.mixer.clipAction(object.animations[0]).play();
                // game.animations.Idle = object.animations[0];
                // game.loadNextAnim(loader);
                game.animate();

                game.addButtons();

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

            this.player.actions.forEach( function ( action ) {
                action.play();
            } );

        }

        // loadNextAnim(loader){
        //     let anim = this.anims.pop();
        //     const game = this;
        //     loader.load(animWalk,function(object){
        //         game.animations[anim] = object.animations[0];

        //         if(game.anims.length > 0){
        //             game.loadNextAnim(loader);
        //         }else{
        //             delete game.anims;
        //             game.action = 'Idle';
        //             game.animate();
        //         }
        //     })
        // }

        // set action(name){
        //     const action = this.player.mixer.clipAction(this.animations[name]);
        //     action.time = 0;
        //     this.player.mixer.stopAllAction();
        //     this.player.action = name;
        //     this.player.actionTime = Date.now();
        //     this.player.actionName = name;
        //     action.crossFadeTo(action, 1, false);
        //     console.log(action);
        //     action.play();
        // }
        // get action(){
        //     if(this.player === undefined || this.player.actionName === undefined) return "";
        //     return this.player.actionName;
        // }

        // toggleAnimation() {
        //     if (game.action == "Idle") {
        //         game.action = "walk";
        //     } else {
        //         game.action = "Idle";
        //     }
        // }

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