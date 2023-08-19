<script lang="ts">
	import { useThrelte, useRender } from '@threlte/core';
	import { EffectComposer, EffectPass, RenderPass, BloomEffect, KernelSize } from 'postprocessing';
	import type { Camera } from 'three';
	import { T } from '@threlte/core';
	const { scene, renderer, camera } = useThrelte();

	const composer = new EffectComposer(renderer);

	const setupEffectComposer = (camera: Camera) => {
		composer.removeAllPasses();
		composer.addPass(new RenderPass(scene, camera));
		composer.addPass(
			new EffectPass(
				camera,
				new BloomEffect({
					intensity: 3,
					luminanceThreshold: 0.4,
					height: 1,
					width: 1,
					luminanceSmoothing: 0.8,
					mipmapBlur: true
				})
			)
		);
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
