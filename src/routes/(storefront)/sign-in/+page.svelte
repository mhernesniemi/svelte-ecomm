<script lang="ts">
	import { SignIn } from 'svelte-clerk';
</script>

<div class="min-h-[60vh] flex items-center justify-center py-12">
	<div class="w-full max-w-md">
		<SignIn
			routing="path"
			path="/sign-in"
			signUpUrl="/sign-up"
			afterSignInUrl="/"
		/>
	</div>
</div>
