<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthWrapper from '$lib/components/authWrapper/AuthWrapper.svelte';
	import type { ActionData } from './$types';
	export let form: ActionData;
</script>

<AuthWrapper>
	<div class="glass w-full m-4 flex justify-center">
		<div class="max-w-lg">
			<h1 class="h1 gradient my-3">Sign up</h1>
			<form method="post" use:enhance>
				<div class="my-3">
					<label class="label" for="username">
						<span>Username</span>
						<input
							class="input variant-soft-tertiary text-white"
							type="text"
							name="username"
							id="username"
						/><br />
					</label>
				</div>
				<div class="my-3">
					<label class="label" for="name">
						<span>Name</span>
						<input
							class="input variant-soft-tertiary text-white"
							type="text"
							name="name"
							id="name"
						/><br />
					</label>
				</div>
				<div class="my-3">
					<label class="label" for="email">
						<span>Email</span>
						<input
							class="input variant-soft-tertiary text-white"
							type="email"
							name="email"
							id="email"
						/><br />
					</label>
				</div>
				<div class="my-3">
					<label class="label" for="password">
						<span>Password</span>
						<input
							class="input variant-soft-tertiary text-white font-bold"
							type="password"
							name="password"
							id="password"
						/><br />
					</label>
				</div>
				<button
					type="submit"
					class="btn variant-filled-tertiary my-7 w-full text-gray-800 font-bold"
				>
					<span class="font-bold">Register</span>
				</button>
			</form>
			{#if form?.message}
				<p class="error">{form.message}</p>
			{/if}
			<a href="/login" class="logo-item variant-ghost-tertiary my-12">Sign in</a>
		</div>
	</div>
</AuthWrapper>
