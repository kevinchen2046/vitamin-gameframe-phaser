

class CustomPipeline1 extends Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline {
    constructor(game: Phaser.Game) {
        super({
            game: game,
            renderer: game.renderer,
            fragShader: [
                "precision mediump float;",

                "uniform float     time;",
                "uniform vec2      resolution;",
                "uniform sampler2D uMainSampler;",
                "varying vec2 outTexCoord;",

                "#define PI 0.01",

                "void main( void ) {",

                "vec2 p = ( gl_FragCoord.xy / resolution.xy ) - 0.5;",
                "float sx = 0.2*sin( 25.0 * p.y - time * 5.);",
                "float dy = 2.9 / ( 20.0 * abs(p.y - sx));",
                "vec4 pixel = texture2D(uMainSampler, outTexCoord);",

                "gl_FragColor = pixel * vec4( (p.x + 0.5) * dy, 0.5 * dy, dy-1.65, pixel.a );",

                "}"
            ].join('\n')
        })
    }
};
class CustomPipeline2 extends Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline {
    constructor(game: Phaser.Game) {
        super({
            game: game,
            renderer: game.renderer,
            fragShader: `
            precision mediump float;

            uniform sampler2D uMainSampler;
            uniform float time;

            varying vec2 outTexCoord;
            varying vec4 outTint;

            #define SPEED 10.0

            void main(void)
            {
                float c = cos(time * SPEED);
                float s = sin(time * SPEED);

                mat4 hueRotation = mat4(0.299, 0.587, 0.114, 0.0, 0.299, 0.587, 0.114, 0.0, 0.299, 0.587, 0.114, 0.0, 0.0, 0.0, 0.0, 1.0) + mat4(0.701, -0.587, -0.114, 0.0, -0.299, 0.413, -0.114, 0.0, -0.300, -0.588, 0.886, 0.0, 0.0, 0.0, 0.0, 0.0) * c + mat4(0.168, 0.330, -0.497, 0.0, -0.328, 0.035, 0.292, 0.0, 1.250, -1.050, -0.203, 0.0, 0.0, 0.0, 0.0, 0.0) * s;

                vec4 pixel = texture2D(uMainSampler, outTexCoord);

                gl_FragColor = pixel * hueRotation;
            }   
            `
        })
    }
};
class Main extends Phaser.Scene {
    private image: Phaser.GameObjects.Image;
    private stime: number = 0;
    private customPipeline1: CustomPipeline1;
    private customPipeline2: CustomPipeline2;
    constructor() {
        super({
            key: "main",
            active: true
        });
        new Phaser.Game({
            type: Phaser.AUTO,
            scale: {
                mode: Phaser.Scale.ScaleModes.RESIZE,
                width: window.innerWidth,
                height: window.innerHeight
            },
            parent: document.getElementsByClassName("app")[0] as HTMLElement,
            backgroundColor: '#2d2d2d',
            scene: [this]
        });

        // this.game.scene.add("main",this);
        window.addEventListener("resize", this.resize.bind(this));
        //this.resize();
    }

    preload() {
        this.load.image('einstein', 'resource/assets/pics/ra-einstein.png');
    }

    create() {
        this.customPipeline1 = (this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).addPipeline('Custom1', new CustomPipeline1(this.game)) as CustomPipeline1;
        this.customPipeline2 = (this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).addPipeline('Custom2', new CustomPipeline2(this.game)) as CustomPipeline2;
        this.customPipeline1.setFloat2('resolution', Number(this.game.config.width), Number(this.game.config.height));

        this.image = this.add.image(128, 64, 'einstein');

        //  1024 x 512 = 4 x 4 = 256 x 128
        //  We're going to create 16 cameras in a 4x4 grid, making each 256 x 128 in size

        var cam = this.cameras.main;

        cam.setSize(256, 128);
        cam.setRenderToTexture(this.customPipeline1);

        var i = 0;
        var b = 0;

        for (var y = 0; y < 4; y++) {
            for (var x = 0; x < 4; x++) {
                i++;
                if (x === 0 && y === 0) {
                    continue;
                }
                if (x === 0) {
                    b = (b) ? 0 : 1;
                }
                cam = this.cameras.add(x * 256, y * 128, 256, 128);
                if (b === 0) {
                    cam.setRenderToTexture(this.customPipeline2);
                    b = 1;
                }
                else {
                    cam.setRenderToTexture(this.customPipeline1);
                    b = 0;
                }
            }
        }
        this.resize();
    }

    resize() {
        // this.game.canvas.width = window.innerWidth;
        // this.game.canvas.height = window.innerHeight;
        this.scale.resize(window.innerWidth, window.innerHeight);
        var { w, h } = { w:this.scale.width / 4, h:this.scale.height / 4 };
        for (var i = 0; i < this.cameras.cameras.length; i++) {
            var camera = this.cameras.cameras[i];
            camera.setPosition((i%4)*w,((i/4)>>0)*h)
            camera.setSize(w,h);
        }
    }

    update() {
        this.image.rotation += 0.01;
        this.customPipeline1.setFloat1('time', this.stime);
        this.customPipeline2.setFloat1('time', this.stime);
        this.stime += 0.005;
    }
}