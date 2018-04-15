/*
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is "Simplenlg".
 *
 * The Initial Developer of the Original Code is Ehud Reiter, Albert Gatt and Dave Westwater.
 * Portions created by Ehud Reiter, Albert Gatt and Dave Westwater are Copyright (C) 2010-11 The University of Aberdeen. All Rights Reserved.
 *
 * Contributor(s): Ehud Reiter, Albert Gatt, Dave Wewstwater, Roman Kutlak, Margaret Mitchell.
 */

import Element from './element';
import DocumentCategory from '../features/DocumentCategory';

/**
 * <p>
 * <code>DocumentElement</code> is a convenient extension of the base
 * <code>NLGElement</code> class. It used to define elements that form part of
 * the textual structure (documents, sections, paragraphs, sentences, lists). It
 * essentially operates as the base class with the addition of some convenience
 * methods for getting and setting features specific to this type of element.
 * </p>
 * <p>
 * <code>TextElements</code> can be structured in a tree-like structure where
 * elements can contain child components. These child components can in turn
 * contain other child components and so on. There are restrictions on the type
 * of child components a particular element type can have. These are explained
 * under the <code>DocumentCategory</code> enumeration.
 * <p>
 * Instances of this class can be created through the static create methods in
 * the <code>OrthographyProcessor</code>.
 * </p>
 * 
 * 
 * @author D. Westwater, University of Aberdeen.
 * @version 4.0
 */

const FEATURE_TITLE = "textTitle";
const FEATURE_COMPONENTS = "textComponents";

class DocumentElement extends Element {

  constructor(category, textTitle){
    super();
    if (arguments.length === 2){
      this.setCategory(category);
      this.setTitle(textTitle);      
    }
  }

  setTitle(textTitle){
    this.setFeature(FEATURE_TITLE, textTitle);
  }

  getTitle(){
    return this.getFeatureAsString(FEATURE_TITLE);
  }

  getComponents(){
    return this.getFeatureAsElementList(FEATURE_COMPONENTS);
  }

  addComponent(element){
    if (element != null) {
      let thisCategory = this.getCategory();
      let category = element.getCategory();
      if (category != null){
        if (DocumentCategory.hasSubPart(thisCategory, category)) {
          this.addElementToComponents(element);
        }
        else {
          let promotedElement = this.promote(element);
          if (promotedElement != null){
            this.addElementToComponents(promotedElement);
          } else {
            // error condition - add original element so something is visible
            this.addElementToComponents (element);
          }
        }
      } else {
        this.addElementToComponents(element);
      }
    }
  }

  addElementToComponents(element){
    let components = this.getComponents();
    components.push(element);
    element.setParent(this);
    this.setComponents(components);
  }

   promote(element){
    if (DocumentCategory.hasSubPart(this.getCategory(), element.getCategory())) {
      return element;
    }
    // if element is not a DocumentElement, embed it in a sentence and recurse
    if (!(element instanceof DocumentElement)) {
      let sentence = new DocumentElement(DocumentCategory.SENTENCE, null);
      sentence.addElementToComponents(element);
      return this.promote(sentence);
    }
    
    // if element is a Sentence, promote it to a paragraph
    if (element.getCategory() == DocumentCategory.SENTENCE) {
      let paragraph = new DocumentElement(DocumentCategory.PARAGRAPH, null);
      paragraph.addElementToComponents(element);
      return this.promote(paragraph);      
    }
    
    // otherwise can't do anything
    return null;
  }

  addComponents(textComponents){
    if (textComponents != null) {
      let thisCategory = this.getCategory();
      let elementsToAdd = [];
      let category = null;

      for (let i = 0; i < textComponents.length; i++){
        let eachElement = textComponents[i];

        if (eachElement instanceof Element){
          category = eachElement.getCategory();
          if (category != null){
            if (thisCategory.hasSubPart(category)){
              elementsToAdd.push(eachElement);
              eachElement.setParent(this);
            }
          }
        }
      }
      if (elementsToAdd.length > 0) {
        let components = this.getComponents();
        if (components == null) {
          components = [];
        }
        components.addAll(elementsToAdd);
        this.setFeature(FEATURE_COMPONENTS, components);
      }
    }
  }

  removeComponent(textComponent){
    let removed = false;

    if (textComponent != null) {
      let components = this.getComponents();
      if (components != null) {
        removed = components.remove(textComponent);
      }
    }
    return removed;
  }

  clearComponents(){
    let components = this.getComponents();
    if (components != null) {
      components.clear();
    }
  }

  getChildren(){
    return this.getComponents();
  }

  setComponents(components){
    this.setFeature(FEATURE_COMPONENTS, components);
  }

  printTree(indent) {
    let thisIndent = indent == null ? " |-" : indent + " |-";
    let childIndent = indent == null ? " | " : indent + " | ";
    let lastIndent = indent == null ? " \\-" : indent + " \\-";
    let lastChildIndent = indent == null ? "   " : indent + "   ";
    let print = "";
    print += "DocumentElement: category=" + this.getCategory();

    let realisation = this.getRealisation();
    if (realisation != null) {
      print += " realisation=" + realisation;
    }
    print += '\n';

    let children = this.getChildren();
    let length = children.length - 1;
    let index = 0;

    if (children.length > 0) {
      for (index = 0; index < length; index++){
        print += thisIndent + children[index].printTree(childIndent);
      }
      print += lastIndent + children[index].printTree(lastChildIndent);
    }
    return print;
  }

}

export default DocumentElement;