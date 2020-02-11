/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from 'vs/platform/registry/common/platform';
import { EditorInput, IEditorInputFactory, IEditorInputFactoryRegistry, Extensions as EditorInputExtensions } from 'vs/workbench/common/editor';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';
import { IEditorRegistry, EditorDescriptor, Extensions as EditorExtensions } from 'vs/workbench/browser/editor';
import { CustomTextEditor } from 'vs/workbench/contrib/customTextEditor/browser/customTextEditor';
import { CustomTextFileEditorInput, CustomUntitledTextEditorInput } from 'vs/workbench/contrib/customTextEditor/browser/customTextEditorInput';
// eslint-disable-next-line code-translation-remind
import { localize } from 'vs/nls';
import { IWorkbenchActionRegistry, Extensions as ActionExtensions } from 'vs/workbench/common/actions';
import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';
import { Action } from 'vs/base/common/actions';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { URI } from 'vs/base/common/uri';
import { Schemas } from 'vs/base/common/network';

// Register file editors
Registry.as<IEditorRegistry>(EditorExtensions.Editors).registerEditor(
	EditorDescriptor.create(
		CustomTextEditor,
		CustomTextEditor.ID,
		localize('binaryFileEditor', "Custom Text Editor")
	),
	[
		new SyncDescriptor<EditorInput>(CustomTextFileEditorInput),
		new SyncDescriptor<EditorInput>(CustomUntitledTextEditorInput)
	]
);

export class OpenCustomTextEditorAction extends Action {

	constructor(
		id: string,
		label: string,
		@IEditorService private readonly editorService: IEditorService,
		@IInstantiationService private readonly instantiationService: IInstantiationService
	) {
		super('openCustomTextEditor', 'Open Custom Text Editor', undefined, true);
	}

	run(): any {
		return this.editorService.openEditor(this.instantiationService.createInstance(CustomTextFileEditorInput, URI.parse(__filename), undefined, undefined));
	}
}

export class OpenUntitledCustomTextEditorAction extends Action {

	constructor(
		id: string,
		label: string,
		@IEditorService private readonly editorService: IEditorService,
		@IInstantiationService private readonly instantiationService: IInstantiationService
	) {
		super('openCustomTextEditor', 'Open Untitled Custom Text Editor', undefined, true);
	}

	run(): any {
		return this.editorService.openEditor(this.instantiationService.createInstance(CustomUntitledTextEditorInput, URI.from({ scheme: Schemas.untitled, path: `Untitled-${Date.now()}` }), false, undefined, undefined, undefined));
	}
}

const registry = Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions);
registry.registerWorkbenchAction(
	SyncActionDescriptor.create(OpenCustomTextEditorAction, 'openCustomTextEditor', 'Open Custom Text Editor'),
	'Open Custom Text Editor'
);

registry.registerWorkbenchAction(
	SyncActionDescriptor.create(OpenUntitledCustomTextEditorAction, 'openUntitledCustomTextEditor', 'Open Untitled Custom Text Editor'),
	'Open Untitled Custom Text Editor'
);

class CustomTextEditorInputFactory implements IEditorInputFactory {

	canSerialize() { return true; }

	serialize(editorInput: EditorInput): string | undefined {
		if (editorInput instanceof CustomTextFileEditorInput || editorInput instanceof CustomUntitledTextEditorInput) {
			return JSON.stringify({
				typeId: editorInput.getTypeId(),
				resource: editorInput.getResource().toString()
			});
		}

		return undefined;
	}

	deserialize(instantiationService: IInstantiationService, serializedEditorInput: string): CustomTextFileEditorInput | CustomUntitledTextEditorInput {
		const deserialized = JSON.parse(serializedEditorInput);
		const resource = URI.parse(deserialized.resource);
		const typeId = deserialized.typeId;

		if (typeId === 'customTextFileEditorInput') {
			return instantiationService.createInstance(CustomTextFileEditorInput, resource, undefined, undefined);
		}

		return instantiationService.createInstance(CustomUntitledTextEditorInput, resource, false, undefined, undefined, undefined);
	}
}

Registry.as<IEditorInputFactoryRegistry>(EditorInputExtensions.EditorInputFactories).registerEditorInputFactory('customTextFileEditorInput', CustomTextEditorInputFactory);
Registry.as<IEditorInputFactoryRegistry>(EditorInputExtensions.EditorInputFactories).registerEditorInputFactory('customUntitledTextEditorInput', CustomTextEditorInputFactory);