<script lang="ts">
	import { SignUp } from 'svelte-clerk';
</script>

<div class="min-h-[60vh] flex items-center justify-center py-12">
	<div class="w-full max-w-md">
		<SignUp
			routing="path"
			path="/sign-up"
			signInUrl="/sign-in"
			afterSignUpUrl="/"
		/>
	</div>
</div>
