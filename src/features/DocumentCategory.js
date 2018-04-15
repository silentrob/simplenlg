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


/**
 * <p>
 * This enumerated type defines the different <i>types</i> of components found
 * in the structure of text. This deals exclusively with the structural format
 * of the text and not of the syntax of the language. Therefore, this
 * enumeration deals with documents, sections, paragraphs, sentences and lists.
 * </p>
 * <p>
 * The enumeration implements the <code>ElementCategory</code> interface, thus
 * making it compatible the SimpleNLG framework.
 * </p>
 * 
 * 
 * @author D. Westwater, University of Aberdeen.
 * @version 4.0
 */

class DocumentCategory {

  static hasSubPart(thisElement, elementCategory){
    return false;
    let subPart = false;
        switch(thisElement){
        case DocumentCategory.DOCUMENT :
          subPart = !(elementCategory.equals(DOCUMENT)) && !(elementCategory.equals(LIST_ITEM));
          break;

        case DocumentCategory.SECTION :
          subPart = elementCategory.equals(PARAGRAPH) || elementCategory.equals(SECTION);
          break;

        case DocumentCategory.PARAGRAPH :
          subPart = elementCategory.equals(SENTENCE) || elementCategory.equals(LIST);
          break;

        case DocumentCategory.LIST :
          subPart = elementCategory.equals(LIST_ITEM);
          break;
        case DocumentCategory.ENUMERATED_LIST :
          subPart = elementCategory.equals(LIST_ITEM);
          break;

        case DocumentCategory.SENTENCE :
        case DocumentCategory.LIST_ITEM :
          subPart = elementCategory == DocumentCategory.SENTENCE || elementCategory == DocumentCategory.LIST_ITEM
        break;

        default :
          break;
        }
      
        // subPart = this.equals(SENTENCE) || this.equals(LIST_ITEM);
      
    return subPart;
  }

};

/** Definition for a document. */
DocumentCategory.DOCUMENT = "DOCUMENT";

/** Definition for a section within a document. */
DocumentCategory.SECTION = "SECTION";

/** Definition for a paragraph. */
DocumentCategory.PARAGRAPH = "PARAGRAPH";

/** Definition for a sentence. */
DocumentCategory.SENTENCE = "SENTENCE";

/** Definition for creating a list of items. */
DocumentCategory.LIST = "LIST";

/** Definition for creating a list of enumerated items. */
DocumentCategory.ENUMERATED_LIST = "ENUMERATED_LIST";

/** Definition for an item in a list. */
DocumentCategory.LIST_ITEM = "LIST_ITEM";


export default DocumentCategory;