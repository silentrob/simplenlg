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
import InflectedWordElement from './inflectedWordElement';

class ListElement extends Element{

  get length() {
    let children = this.getChildren();
    if (children == undefined) {
      return 0;
    }
    return children.length;
  }

  addComponent(newComponent){
    let components = this.getFeatureAsElementList('COMPONENTS');
    if (components == null) {
      components = [];
    }
    
    components.push(newComponent);
    this.setFeature('COMPONENTS', components);
  }

  addComponents(newComponents) {
    let components = this.getFeatureAsElementList('COMPONENTS');
    if (components == null) {
      components = [];
    }
    components.addAll(newComponents);
    this.setFeature('COMPONENTS', components);
  }

  getFirst(){
    let children = this.getChildren();
    return (children == undefined) ? null : children[0];
  }

  getChildren(){
    return this.getFeatureAsElementList('COMPONENTS');
  }

  printTree(indent) {
    let thisIndent = indent == null ? " |-" : indent + " |-";
    let childIndent = indent == null ? " | " : indent + " | ";
    let lastIndent = indent == null ? " \\-" : indent + " \\-";
    let lastChildIndent = indent == null ? "   " : indent + "   ";
    
    let print = "ListElement: features={";
    
    let features = this.getAllFeatures();
    for (let eachFeature in features){
      print += eachFeature + "=" + features[eachFeature] + " ";
    }
    print += "}\n";
    
    let children = this.getChildren();
    let length = children.length - 1;
    for (let index = 0; index < length; index++) {
      print += thisIndent + children[index].printTree(childIndent);
    }

    if (length >= 0) {
      print += lastIndent + children[length].printTree(lastChildIndent);
    }

    return print;
  }

}

export default ListElement;