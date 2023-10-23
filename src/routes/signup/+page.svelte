<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthWrapper from '$lib/components/authWrapper/AuthWrapper.svelte';

	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<AuthWrapper>
	<div>
		<h1 class="h1 gradient my-3">Sign up</h1>
		<form method="post" use:enhance>
			<div class="my-3">
				<label for="username">Username</label>
				<input name="username" id="username" /><br />
			</div>
			<div class="my-3">
				<label for="password">Password</label>
				<input type="password" name="password" id="password" /><br />
			</div>
			<button type="button" class="btn variant-filled-tertiary my-3 text-gray-800 font-bold">
				<button type="submit">
					<span class="font-bold">Register</span>
				</button>
			</button>
		</form>
		{#if form?.message}
			<p class="error">{form.message}</p>
		{/if}
		<a href="/login" class="logo-item variant-ghost-tertiary">Sign in</a>
	</div>
</AuthWrapper>
