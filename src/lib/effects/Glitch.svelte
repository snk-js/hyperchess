<script lang="ts">
	import { useThrelte, useRender } from '@threlte/core';
	import { EffectComposer, EffectPass, RenderPass, GlitchEffect, KernelSize } from 'postprocessing';
	import type { Camera } from 'three';
	import { T } from '@threlte/core';
	import { BlendFunction } from 'postprocessing'; // or wherever BlendFunction is defined
	import { Vector2 } from 'three'; // if using Three.js's Vector2
	const { scene, renderer, camera } = useThrelte();

	const composer = new EffectComposer(renderer);

	const glitchEffect = new GlitchEffect({
		blendFunction: BlendFunction.NORMAL, // Choose the blend function
		chromaticAberrationOffset: new Vector2(0.1, 0.1), // Adjust the chromatic aberration offset
		delay: new Vector2(0.5, 2.0), // Set min and max delay between glitches
		duration: new Vector2(0.2, 0.5), // Set min and max duration of a glitch
		strength: new Vector2(0.1, 0.5), // Set the strength of weak and strong glitches
		// perturbationMap: new Texture(), // Provide a Texture if needed
		dtSize: 2, // The size of the noise map
		columns: 0.05, // The scale of the blocky glitch columns
		ratio: 0.85 // The ratio (comment says to change to 0.15, so you can do that if needed)
	});

	const setupEffectComposer = (camera: Camera) => {
		composer.removeAllPasses();
		composer.addPass(new RenderPass(scene, camera));
		composer.addPass(new EffectPass(camera, glitchEffect));
	};

	$: setupEffectComposer($camera);

	useRender((_, delta) => {
		composer.render(delta);
	});
</script>

<T.Mesh position={[-0.5, 2, 0]}>
	<T.SphereGeometry args={[0, 32, 32]} />
	<T.MeshStandardMaterial color="hotpink" />
</T.Mesh>
