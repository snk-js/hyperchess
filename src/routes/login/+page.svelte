<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthWrapper from '$lib/components/authWrapper/AuthWrapper.svelte';

	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<AuthWrapper>
	<div>
		<h1 class="h1 my-3">
			<span
				class="bg-gradient-to-br from-green-500 to-purple-400 bg-clip-text text-transparent box-decoration-clone"
				>Sign in</span
			>
		</h1>
		<form method="post" use:enhance>
			<div class="my-3">
				<label class="label" for="username">
					<span> username </span>
					<input class="input variant-soft-primary text-white" name="username" id="username" /><br
					/>
				</label>
			</div>
			<div class="my-3">
				<label class="label" for="password">
					<span> password </span>
					<input
						class="input variant-soft-primary text-white"
						type="password"
						name="password"
						id="password"
					/><br />
				</label>
			</div>
			<button type="submit" class="w-full btn variant-filled-primary my-3 text-gray-800 font-bold">
				<span class="font-bold"> Sign in </span>
			</button>
		</form>
		{#if form?.message}
			<p class="error">{form.message}</p>
		{/if}
		<a href="/signup" class="logo-item variant-ghost-primary my-12">Sign up</a>
	</div>
</AuthWrapper>
