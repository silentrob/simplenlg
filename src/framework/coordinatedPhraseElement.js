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

import Feature from '../features/Feature';
import Person from '../features/Person';
import Gender from '../features/Gender';
import LexicalFeature from '../features/LexicalFeature';
import InternalFeature from '../features/InternalFeature';
import LexicalCategory from '../features/LexicalCategory';
import NumberAgreement from '../features/NumberAgreement';
import DiscourseFunction from '../features/DiscourseFunction';
import PhraseCategory from '../features/PhraseCategory';

import Element from './element';
import StringElement from './stringElement';

const PLURAL_COORDINATORS = ["and"];

class CoordinatedPhraseElement extends Element {
  constructor(coordinate1, coordinate2){
    super();
    if (coordinate1 && coordinate2){
      this.addCoordinate(coordinate1);
      this.addCoordinate(coordinate2);
    }
    
    this.setFeature(Feature.CONJUNCTION, "and");
  }

  /**
   * Adds a new coordinate to this coordination. If the new coordinate is a
   * <code>NLGElement</code> then it is added directly to the coordination. If
   * the new coordinate is a <code>String</code> a <code>StringElement</code>
   * is created and added to the coordination. <code>StringElement</code>s
   * will have their complementisers suppressed by default. In the case of
   * clauses, complementisers will be suppressed if the clause is not the
   * first element in the coordination.
   * 
   * @param newCoordinate
   *            the new coordinate to be added.
   */
  addCoordinate(newCoordinate) {
    let coordinates = this.getFeatureAsElementList(InternalFeature.COORDINATES);
    if (coordinates == null) {
      coordinates = [];
      this.setFeature(InternalFeature.COORDINATES, coordinates);
    } else if (coordinates.length == 0) {
      this.setFeature(InternalFeature.COORDINATES, coordinates);
    }

    if (newCoordinate instanceof Element) {
      if (newCoordinate.isA(PhraseCategory.CLAUSE) && coordinates.length > 0){
        newCoordinate.setFeature(Feature.SUPRESSED_COMPLEMENTISER, true);
      }

      coordinates.push(newCoordinate);
    } else if (typeof newCoordinate == "string"){
      let coordElement = new StringElement(newCoordinate);
      coordElement.setFeature(Feature.SUPRESSED_COMPLEMENTISER, true);
      coordinates.push(coordElement);
    }
    this.setFeature(InternalFeature.COORDINATES, coordinates);
  }

  getChildren(){
    return this.getFeatureAsElementList(InternalFeature.COORDINATES);
  }

  /**
   * Clears the existing coordinates in this coordination. It performs exactly
   * the same as <code>removeFeature(Feature.COORDINATES)</code>.
   */
  clearCoordinates(){
    this.removeFeature(InternalFeature.COORDINATES);
  }

  /**
   * Adds a new pre-modifier to the phrase element. Pre-modifiers will be
   * realised in the syntax before the coordinates.
   * 
   * @param newPreModifier
   *            the new pre-modifier as an <code>NLGElement</code>.
   */
  addPreModifier(newPreModifier) {
    let preModifiers = this.getFeatureAsElementList(InternalFeature.PREMODIFIERS);
    if (preModifiers == null) {
      preModifiers = [];
    }

    if (typeof newPreModifier == "string"){
      newPreModifier = new StringElement(newPreModifier);
    }

    preModifiers.push(newPreModifier);
    this.setFeature(InternalFeature.PREMODIFIERS, preModifiers);
  }

  /**
   * Retrieves the list of pre-modifiers currently associated with this
   * coordination.
   * 
   * @return a <code>List</code> of <code>NLGElement</code>s.
   */
  getPreModifiers() {
    return this.getFeatureAsElementList(InternalFeature.PREMODIFIERS);
  }

  /**
   * Retrieves the list of complements currently associated with this
   * coordination.
   * 
   * @return a <code>List</code> of <code>NLGElement</code>s.
   */
  getComplements() {
    return this.getFeatureAsElementList(InternalFeature.COMPLEMENTS);
  }

  /**
   * Adds a new post-modifier to the phrase element. Post-modifiers will be
   * realised in the syntax after the coordinates.
   * 
   * @param newPostModifier
   *            the new post-modifier as an <code>NLGElement</code>.
   */
  addPostModifier(newPostModifier) {
    let postModifiers = this.getFeatureAsElementList(InternalFeature.POSTMODIFIERS);
    if (postModifiers == null) {
      postModifiers = [];
    }

    if (typeof newPostModifier == "string"){
      newPostModifier = new StringElement(newPostModifier);
    }

    postModifiers.push(newPostModifier);
    this.setFeature(InternalFeature.POSTMODIFIERS, postModifiers);
  }

  /**
   * Retrieves the list of post-modifiers currently associated with this
   * coordination.
   * 
   * @return a <code>List</code> of <code>NLGElement</code>s.
   */
  getPostModifiers(){
    return this.getFeatureAsElementList(InternalFeature.POSTMODIFIERS);
  }

  
  printTree(indent){
    let thisIndent = indent == null ? " |-" : indent + " |-";
    let childIndent = indent == null ? " | " : indent + " | ";
    let lastIndent = indent == null ? " \\-" : indent + " \\-";
    let lastChildIndent = indent == null ? "   " : indent + "   ";
    let print = "CoordinatedPhraseElement:\n";
    
    let children = this.getChildren();
    let length = children.length - 1;
    let index = 0;

    for (index = 0; index < length; index++) {
      print += thisIndent + children[index].printTree(childIndent);
    }
    if (length >= 0) {
      print += lastIndent + children[length].printTree(lastChildIndent);
    }

    return print;
  }

  /**
   * Adds a new complement to the phrase element. Complements will be realised
   * in the syntax after the coordinates. Complements differ from
   * post-modifiers in that complements are crucial to the understanding of a
   * phrase whereas post-modifiers are optional.
   * 
   * @param newComplement
   *            the new complement as an <code>NLGElement</code>.
   */
  addComplement(newComplement) {
    let complements = this.getFeatureAsElementList(InternalFeature.COMPLEMENTS);
    if (complements == null) {
      complements = [];
    }
    if (typeof newComplement == "string"){
      newComplement = new StringElement(newComplement);
    }
    complements.push(newComplement);
    this.setFeature(InternalFeature.COMPLEMENTS, complements);
  }

  /**
   * A convenience method for retrieving the last coordinate in this
   * coordination.
   * 
   * @return the last coordinate as represented by a <code>NLGElement</code>
   */
  getLastCoordinate(){
    let children = this.getChildren();
    return children != null && children.length > 0 ? children[children.length - 1] : null;
  }
  
  /** set the conjunction to be used in a coordinatedphraseelement
   * @param conjunction
   */
  setConjunction(conjunction){
    this.setFeature(Feature.CONJUNCTION, conjunction);
  }
  
  /**
   * @return  conjunction used in coordinatedPhraseElement
   */
  getConjunction(){
    return this.getFeatureAsString(Feature.CONJUNCTION);
  }
  
  /**
   * @return true if this coordinate is plural in a syntactic sense
   */
  checkIfPlural(){
    // doing this right is quite complex, take simple approach for now
    let size = this.getChildren().length;
    if (size == 1){
      return (NumberAgreement.PLURAL == this.getLastCoordinate().getFeature(Feature.NUMBER));
    } else {
      return PLURAL_COORDINATORS.indexOf(this.getConjunction()) != -1;
    }
  }

}

export default CoordinatedPhraseElement;