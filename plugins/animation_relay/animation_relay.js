(function() {
	'use strict';

	const PLUGIN_ID = 'animation_relay';
	const VERSION = '1.0.0';

	let captureAction;
	let applyAction;
	let clearAction;
	let savedAnimation = null;

	function clone(data) {
		return JSON.parse(JSON.stringify(data));
	}

	function getSelectedAnimation() {
		if (typeof Animation === 'undefined' || !Animation.selected) {
			Blockbench.showQuickMessage('Select an animation first.');
			return null;
		}
		return Animation.selected;
	}

	function buildTransferData(animation) {
		const copy = animation.getUndoCopy();
		const animators = {};

		for (const uuid in copy.animators || {}) {
			const animator = copy.animators[uuid];

			// v1 deliberately targets Blockbench bone/group animation.
			if (animator.type !== 'bone' || !animator.name) continue;

			// Animation import resolves bone UUIDs by name when the UUID is not supplied.
		if (animators[animator.name]) {
				return {
					error: 'Duplicate bone name: "' + animator.name + '". Rename the duplicate bones and try again.'
				};
			}

			animators[animator.name] = animator;
		}

		if (!Object.keys(animators).length) {
			return {
				error: 'The selected animation has no supported bone/group keyframes.'
			};
		}

		return {
			name: copy.name || 'Animation',
			loop: copy.loop || 'once',
			override: !!copy.override,
			length: copy.length || animation.getMaxLength() || 1,
			snapping: copy.snapping || 100,
			animators
		};
	}

	function captureAnimation() {
		const animation = getSelectedAnimation();
		if (!animation) return;

		const data = buildTransferData(animation);
		if (data.error) {
			Blockbench.showMessageBox({
				title: 'Animation Relay',
				message: data.error,
				icon: 'warning'
			});
			return;
		}

		savedAnimation = clone(data);

		const boneCount = Object.keys(savedAnimation.animators).length;
		Blockbench.showQuickMessage(
			'Saved "' + savedAnimation.name + '" (' + boneCount + ' bones)'
		);
	}

	function applyAnimation() {
		if (!savedAnimation) {
			Blockbench.showQuickMessage('No animation is saved. Capture one first.');
			return;
		}

		if (typeof Group === 'undefined' || !Group.all) {
			Blockbench.showQuickMessage('Open a model with bones/groups first.');
			return;
		}

		const source = clone(savedAnimation);
		const missing = [];
		const targetGroups = {};

		for (const boneName in source.animators) {
			const target = Group.all.find(group =>
				group.name.toLowerCase() === boneName.toLowerCase()
			);

			if (!target) {
				missing.push(boneName);
			} else {
				targetGroups[boneName] = target;
			}
		}

		if (missing.length) {
			const preview = missing.slice(0, 8).join(', ');
			const suffix = missing.length > 8 ? ' ...' : '';

			Blockbench.showMessageBox({
				title: 'Animation Relay',
				message:
					'Missing ' + missing.length + ' bone/group name' +
					(missing.length === 1 ? '' : 's') + ': ' +
					preview + suffix +
					'\n\nNothing was changed. Rename the target bones to match and try again.',
				icon: 'warning'
			});
			return;
		}

		// Supplying names instead of source UUIDs makes Blockbench resolve
		// the animation onto the target model's own group UUIDs.
		const importData = {
			name: source.name + ' (Imported)',
			loop: source.loop,
			override: source.override,
			length: source.length,
			snapping: source.snapping,
			animators: source.animators
		};

		let animation;
		try {
			animation = new Animation(importData);
			animation.createUniqueName();
			animation.add(true);
			animation.select();
		} catch (error) {
			console.error('[Animation Relay] Failed to apply animation:', error);
			Blockbench.showMessageBox({
				title: 'Animation Relay',
				message: 'Blockbench could not create the imported animation. Check the developer console for details.',
				icon: 'error'
			});
			return;
		}

		Blockbench.showQuickMessage(
			'Applied "' + source.name + '" to ' + Object.keys(targetGroups).length + ' bones'
		);
	}

	function clearAnimation() {
		savedAnimation = null;
		Blockbench.showQuickMessage('Saved animation cleared.');
		updateActions();
	}


	Plugin.register(PLUGIN_ID, {
		title: 'Animation Relay',
		author: 'yamasung7-dot',
		description: 'Capture a Blockbench bone animation and apply it to another model by matching bone names.',
		about: 'Animation Relay v1.0.0 copies selected bone/group animations between Blockbench models. It intentionally matches bones by name and does not perform automatic retargeting.',
		version: VERSION,
		icon: 'sync_alt',
		variant: 'both',
		min_version: '4.8.0',
		tags: ['Animation', 'Rigging', 'Tools'],
		new_repository_format: true,
		repository: 'https://github.com/yamasung7-dot/GIGLET',
		website: 'https://github.com/yamasung7-dot/GIGLET',

		onload() {
		captureAction = new Action('animation_relay_capture', {
			name: 'Animation Relay: Capture Selected',
			icon: 'content_copy',
			condition: () => Modes.animate && !!Animation.selected,
			click: captureAnimation
		});

		applyAction = new Action('animation_relay_apply', {
			name: 'Animation Relay: Apply Saved',
			icon: 'content_paste',
			condition: () => !!savedAnimation && typeof Group !== 'undefined' && Group.all && Group.all.length > 0,
			click: applyAnimation
		});

		clearAction = new Action('animation_relay_clear', {
			name: 'Animation Relay: Clear Saved',
			icon: 'delete',
			condition: () => !!savedAnimation,
			click: clearAnimation
		});

		MenuBar.menus.tools.addAction(captureAction);
		MenuBar.menus.tools.addAction(applyAction);
		MenuBar.menus.tools.addAction(clearAction);

	},

	onunload() {
		if (captureAction) MenuBar.menus.tools.removeAction(captureAction);
		if (applyAction) MenuBar.menus.tools.removeAction(applyAction);
		if (clearAction) MenuBar.menus.tools.removeAction(clearAction);

		captureAction = null;
		applyAction = null;
		clearAction = null;
		savedAnimation = null;
	}
});
})();