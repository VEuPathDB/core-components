import React, { useState, FunctionComponent, MouseEventHandler, useEffect, useMemo } from 'react';

// import Icon from 'wdk-client/Components/Icon/Icon';
import CheckboxTreeNode, { CustomCheckboxes } from './CheckboxTreeNode';
import RealTimeSearchBox from '../RealTimeSearchBox/RealTimeSearchBox';

import { addOrRemove, propsDiffer } from './Utils';
import { isLeaf, getLeaves, getBranches, mapStructure } from './Utils';
import { parseSearchQueryString } from './Utils';
import { Seq } from './Utils';

const NODE_STATE_PROPERTY = '__expandableTreeState';
const NODE_CHILDREN_PROPERTY = '__expandableTreeChildren';

export enum LinksPosition {
  None,
  Top = 1 << 1,
  Bottom = 1 << 2,
  Both = Top | Bottom
}

type StatefulNode<T> = T & {
  __expandableTreeState: {
    isSelected: boolean,
    isVisible: boolean,
    isIndeterminate?: boolean,
    isExpanded?: boolean
  };
  __expandableTreeChildren: StatefulNode<T>[];
};

let Bar = () => <span> | </span>;

type ChangeHandler = (ids: string[]) => void;

export type Props<T> = {

  //%%%%%%%%%%% Basic expandable tree props %%%%%%%%%%%

  /** Node representing root of the data to be rendered as an expandable tree */
  tree: T;

  /** Takes a node, returns unique ID for this node; ID is used as input value of the nodes checkbox if using selectability */
  getNodeId: (node: T) => string;

  /** Takes a node, Called during rendering to provide the children for the current node */
  getNodeChildren:  (node: T) => T[];

  /** Called when the set of expanded (branch) nodes changes.  The function will be called with the array of the expanded node ids.  If omitted, no handler is called. */
  onExpansionChange: ChangeHandler;

  /** Whether to, on expanding a node, automatically expand its descendants with one child */
  shouldExpandDescendantsWithOneChild?: boolean;

  /** Whether to expand a node if its contents are clicked */
  shouldExpandOnClick?: boolean

  /** Whether to show the root node or start with the array of children; optional, defaults to false */
  showRoot?: boolean;

  /** Called during rendering to create the react element holding the display name and tooltip for the current node, defaults to <span>{this.props.getNodeId(node)</span> */
  renderNode?: (node: T, path?: number[]) => React.ReactNode;

  /** List of expanded nodes as represented by their ids, default to null; if null, expandedList will be generated by the expandable tree. */
  expandedList: string[];

  //%%%%%%%%%%% Properties associated with selectability %%%%%%%%%%%

  /** If true, checkboxes and ‘select…’ links are shown and the following parameters are honored, else no checkboxes or ‘select…’ links are shown and props below are ignored; default to false */
  isSelectable?: boolean;

  /** List of selected nodes as represented by their ids, defaults to [ ] */
  selectedList: string[];

  /** An object mapping a node (by its id) to a function that returns a React component. This component will be used instead of the default checkbox. */
  customCheckboxes?: CustomCheckboxes<T>;

  /** Tells whether more than one selection is allowed; defaults to true.  If false, only the first item in selectedList is selected, and radio boxes are rendered. */
  isMultiPick?: boolean;

  /** Value to use for the name of the checkboxes in the tree */
  name?: string;

  /** Takes array of ids, thus encapsulates:
   selectAll, clearAll, selectDefault, selectCurrent (i.e. reset) */
  onSelectionChange: ChangeHandler;

  /** List of “current” ids, if omitted (undefined or null), then don’t display link */
  currentList?: string[];

  /** List of default ids, if omitted (undefined or null), then don’t display link */
  defaultList?: string[];

  //%%%%%%%%%%% Properties associated with search %%%%%%%%%%%

  /** Indicates whether this is a searchable CBT.  If so, then show boxes and respect the optional parameters below, also turn off expansion; default to false */
  isSearchable: boolean;

  /** Indicates if the search box should have autoFocus set to true */
  autoFocusSearchBox?: boolean;

  /** Whether to show search box; defaults to true (but only if isSearchable is true).  Useful if searching is controlled elsewhere */
  showSearchBox?: boolean;

  /** PlaceHolder text; shown in grey if searchTerm is empty */
  searchBoxPlaceholder: string;

  /** Name of icon to show in search box */
  searchIconName?: string;

  /** Search box help text: if present, a help icon will appear; mouseover the icon and a tooltip will appear with this text */
  searchBoxHelp?: string;

  /** Current search term; if non-empty, expandability is disabled */
  searchTerm: string;

  /** Takes single arg: the new search text.  Called when user types into the search box */
  onSearchTermChange: (term: string) => void;

  /** Takes (node, searchTerms) and returns boolean. searchTerms is a list of query terms, parsed from the original input string. This function returns a boolean indicating if a node matches search criteria and should be shown */
  searchPredicate: (node: T, terms: string[]) => boolean;

  renderNoResults?: (searchTerm: string, tree: T) => React.ReactNode;

  //%%%%%%%%%%% Miscellaneous UI %%%%%%%%%%%

  /** Link placement */
  linksPosition?: LinksPosition;

  /** Additional actions to render with links */
  additionalActions?: React.ReactNode[];

  /** Additional filter controls to render with searchbox */
  additionalFilters?: React.ReactNode[];

  /** Indicates if an additional filter has been applied; optional, defaults to false */
  isAdditionalFilterApplied?: boolean;

  /** Wrap tree section with additional UI elements */
  wrapTreeSection?: (treeSection: React.ReactNode) => React.ReactNode;
};

type TreeLinkHandler = MouseEventHandler<HTMLButtonElement>;

type TreeLinksProps = {
  showSelectionLinks: boolean;
  showExpansionLinks: boolean;
  showCurrentLink: boolean;
  showDefaultLink: boolean;
  selectAll: TreeLinkHandler;
  selectNone: TreeLinkHandler;
  addVisible: TreeLinkHandler;
  removeVisible: TreeLinkHandler;
  selectOnlyVisible: TreeLinkHandler;
  expandAll: TreeLinkHandler;
  expandNone: TreeLinkHandler;
  selectCurrentList: TreeLinkHandler;
  selectDefaultList: TreeLinkHandler;
  isFiltered: boolean;
  additionalActions?: React.ReactNode[];
}

/**
 * Renders tree links to select, clear, expand, collapse all nodes, or reset to current or default
 */
let TreeLinks: FunctionComponent<TreeLinksProps> = props => {
  let {
    showSelectionLinks, showExpansionLinks, showCurrentLink, showDefaultLink,
    selectAll, selectNone, expandAll, expandNone, selectCurrentList, selectDefaultList,
    addVisible, removeVisible, selectOnlyVisible, isFiltered, additionalActions
  } = props;

  return (
    <div>

      { isFiltered && showSelectionLinks &&
        <div>
          <button type="button" onClick={selectOnlyVisible}>select only these</button>
          <Bar/>
          <button type="button" onClick={addVisible}>add these</button>
          <Bar/>
          <button type="button" onClick={removeVisible}>clear these</button>
        </div>
      }

      <div>
        { !isFiltered && showSelectionLinks &&
          <span>
            <button type="button" onClick={selectAll}>select all</button>
            <Bar/>
            <button type="button" onClick={selectNone}>clear all</button>
          </span> }

        { showExpansionLinks &&
          <span>
            { showSelectionLinks && <Bar/> }
            <button type="button" onClick={expandAll}>expand all</button>
            <Bar/>
            <button type="button" onClick={expandNone}>collapse all</button>
          </span> }

        { showSelectionLinks && showCurrentLink &&
          <span>
            <Bar/>
            <button type="button" onClick={selectCurrentList}>reset to current</button>
          </span>
        }

        { showSelectionLinks && showDefaultLink &&
          <span>
            <Bar/>
            <button type="button" onClick={selectDefaultList}>reset to default</button>
          </span>
        }

      </div>

      { additionalActions && additionalActions.length > 0 &&
        <div>
          { additionalActions.map((action, index, additionalActions) => (
            <span key={index}>
              {action}
              {index !== (additionalActions.length - 1) && <Bar/>}
            </span>
          )) }
        </div>
      }

    </div>
  );
};

type ListFetcher = () => string[] | void;

/**
 * Creates a function that will handle a click of one of the tree links above
 */
function createLinkHandler<T>(treeObj: CheckboxTree<T>, idListFetcher: ListFetcher, changeHandlerProp: keyof Props<T>): TreeLinkHandler {
  return function(event) {

    // prevent update to URL
    event.preventDefault();

    // get changeHandler
    let changeHandler = treeObj.props[changeHandlerProp] as ChangeHandler;

    // call instance's change handler with the appropriate ids
    let idList = idListFetcher();
    if (idList !== undefined && idList !== null) {
        changeHandler(idList);
    }

  };
}

/**
 * Creates a function that will handle expansion-related tree link clicks
 */
function createExpander<T>(treeObj: CheckboxTree<T>, listFetcher: ListFetcher) {
  return createLinkHandler(treeObj, listFetcher, 'onExpansionChange');
}

/**
 * Creates a function that will handle selection-related tree link clicks
 */
function createSelector<T>(treeObj: CheckboxTree<T>, listFetcher: ListFetcher) {
  return createLinkHandler(treeObj, listFetcher, 'onSelectionChange');
}

/**
 * Creates appropriate initial state values for a node in the stateful tree
 */
function getInitialNodeState<T>(node: T, getNodeChildren: (t: T) => T[]) {
  return Object.assign({}, {
    // these state properties apply to all nodes
    isSelected: false, isVisible: true
  }, isLeaf(node, getNodeChildren) ? {} : {
    // these state properties only apply to branch nodes (not leaves)
    isExpanded: false, isIndeterminate: false
  })
}

interface AdditionalFiltersProps {
  filters?: React.ReactNode[];
}

/**
 * Renders additional filters to supplement the default searchbox
 */
function AdditionalFilters({ filters }: AdditionalFiltersProps) {
  return (
    <>
      {
        filters != null && filters.length > 0 &&
        <div>
          {
            filters.map((filter, index) => (
              <span key={index}>
                {filter}
              </span>
            ))
          }
        </div>
      }
    </>
  );
}

/**
 * Creates a copy of the input tree, populating each node with initial state.
 * Note this initial state is generic and not dependent on props.  The first
 * call to applyPropsToStatefulTree() applies props to an existing stateful tree.
 */
function createStatefulTree<T>(root: T, getNodeChildren: (t: T) => T[]) {
  let mapFunction = (node: T, mappedChildren: StatefulNode<T>[]) =>
    Object.assign({} as T, node, {
      __expandableTreeChildren: mappedChildren,
      __expandableTreeState: getInitialNodeState(node, getNodeChildren)
    });
  return mapStructure(mapFunction, getNodeChildren, root);
};

/**
 * Applies a set of expandable tree props to an existing stateful tree (a copy
 * of the input tree with additional state applied).  The resulting tree is a
 * copy of the input stateful tree, with any unchanged nodes staying the same
 * (i.e. same object) so node rendering components can use referential equality
 * to decide whether to re-render.  Any parent of a modified node is replaced
 * with a new node to ensure any modified branches are re-rendered up to the
 * root node.
 *
 * In addition to the replaced tree, the returned object contains the list of
 * expanded nodes.  If an expanded node list is sent in as a prop, it is used,
 * but if the prop is empty or null, the expanded list is generated by the
 * checkbox tree according to the following rules:
 *
 * - if all descendent leaves are selected, the node is collapsed
 * - if no descendent leaves are selected, the node is collapsed
 * - if some but not all descendent leaves are selected, the node is expanded
 */
function applyPropsToStatefulTree<T>(root: StatefulNode<T>, props: Props<T>, isLeafVisible: (id: string) => boolean, stateExpandedList?: string[]) {

  let { getNodeId, getNodeChildren, isSelectable, isMultiPick, selectedList } = props;
  let propsExpandedList = props.expandedList;

  // if single-pick then trim selected list so at most 1 item present
  if (!isMultiPick && selectedList.length > 1) {
    console.warn("CheckboxTree: isMultiPick = false, but more than one item selected.  Ignoring all but first item.");
    selectedList = [ selectedList[0] ];
  }

  // if expanded list is null, then use default rules to determine expansion rather than explicit list
  let expandedList = propsExpandedList != null ? propsExpandedList : stateExpandedList;
  let expansionListProvided = (expandedList != null);
  let generatedExpandedList = new Set<string>();

  // convert arrays to sets for search efficiency
  let selectedSet = new Set<string>(selectedList);
  let expandedSet = new Set<string>(expandedList);

  let mapFunction = (node: StatefulNode<T>, mappedChildren: StatefulNode<T>[]) => {

    let nodeId = getNodeId(node);
    let { isSelected, isVisible, isExpanded, isIndeterminate } = getNodeState(node);
    let newState = Object.assign({}, getNodeState(node));
    let modifyThisNode = false;

    if (isLeaf(node, getNodeChildren)) {
      // only leaves can change via direct selectedness and direct visibility
      let newIsSelected = (isSelectable && selectedSet.has(nodeId));
      let newIsVisible = isLeafVisible(nodeId);
      if (newIsSelected !== isSelected || newIsVisible != isVisible) {
        modifyThisNode = true;
        newState = Object.assign(newState, {
          isSelected: newIsSelected,
          isVisible: newIsVisible
        });
      }
    }
    else {
      // branches can change in all ways; first inspect children to gather information
      let selectedChildFound = false;
      let unselectedChildFound = false;
      let indeterminateChildFound = false;
      let visibleChildFound = false;

      let oldChildren = getStatefulChildren(node);
      for (let i = 0; i < oldChildren.length; i++) {
        let newChild = mappedChildren[i];
        if (newChild !== oldChildren[i]) {
          // reference equality check failed; a child has been modified, so must modify this node
          modifyThisNode = true;
        }
        let newChildState = getNodeState(newChild);
        if (newChildState.isSelected)
          selectedChildFound = true;
        else
          unselectedChildFound = true;
        if (newChildState.isIndeterminate)
          indeterminateChildFound = true;
        if (newChildState.isVisible)
          visibleChildFound = true;
      }

      // determine new state and compare with old to determine if this node should be modified
      let newIsSelected = (!indeterminateChildFound && !unselectedChildFound);
      let newIsIndeterminate = !newIsSelected && (indeterminateChildFound || selectedChildFound);
      let newIsVisible = visibleChildFound;
      let newIsExpanded = (isActiveSearch(props) && newIsVisible) ||
          (expansionListProvided ? expandedSet.has(nodeId) :
              (indeterminateChildFound || (selectedChildFound && (!isMultiPick || unselectedChildFound))));

      if (!expansionListProvided && newIsExpanded) {
        generatedExpandedList.add(nodeId);
      }

      if (modifyThisNode ||
          newIsSelected !== isSelected ||
          newIsIndeterminate !== isIndeterminate ||
          newIsExpanded !== isExpanded ||
          newIsVisible !== isVisible) {
        modifyThisNode = true;
        newState = Object.assign(newState, {
          isSelected: newIsSelected,
          isVisible: newIsVisible,
          isIndeterminate: newIsIndeterminate,
          isExpanded: newIsExpanded
        });
      }
    }

    // return the existing node if no changes present in this or children; otherwise create new
    return !modifyThisNode ? node
      : Object.assign({}, node, {
        [NODE_CHILDREN_PROPERTY]: mappedChildren,
        [NODE_STATE_PROPERTY]: newState
      });
  }

  // generate the new stateful tree, and expanded list (if necessary)
  let newStatefulTree = mapStructure(mapFunction, getStatefulChildren, root);
  return {
    // convert whichever Set we want back to an array
    expandedList: Array.from(expansionListProvided ? expandedSet : generatedExpandedList),
    statefulTree: newStatefulTree
  };
}

/**
 * Returns true if a search is being actively performed (i.e. if this tree is
 * searchable, and at least one filter has been applied).
 */
function isActiveSearch({ isAdditionalFilterApplied, isSearchable, searchTerm }: Props<any>) {
  return isSearchable && isFiltered(searchTerm, isAdditionalFilterApplied);
}

/**
 * Returns true if at least one filter has been applied, that is, if:
 * 1. the search term is non-empty, or
 * 2. an "additional filter" has been applied
 */
function isFiltered(searchTerm: string, isAdditionalFilterApplied?: boolean) {
  return (
    searchTerm.length > 0 ||
    Boolean(isAdditionalFilterApplied)
  );
}

/**
 * Returns a function that takes a leaf node ID and returns true if leaf node
 * should be visible.  If no search is being performed, all leaves are visible,
 * unless one of their ancestors is collapsed.  In that case visibility of the
 * leaf container is controlled by a parent, so the function returned here will
 * still return true.
 *
 * If a search is being actively performed, matching nodes, their children, and
 * their ancestors, will be visible (expansion is locked and all branches are
 * expanded).  The function returned by createIsLeafVisible does not care about
 * branches, but tells absolutely if a leaf should be visible (i.e. if the leaf
 * matches the search or if any ancestor matches the search).
 */
function createIsLeafVisible<T>(props: Props<T>) {
  let { tree, searchTerm, searchPredicate, getNodeId, getNodeChildren } = props;
  // if not searching, then all nodes are visible
  if (!isActiveSearch(props)) {
    return (nodeId: string) => true;
  }
  // otherwise must construct array of visible leaves
  let visibleLeaves = new Set<string>();
  let searchTerms = parseSearchQueryString(searchTerm);
  let addVisibleLeaves = (node: T, parentMatches: boolean) => {
    // if parent matches, automatically match (always show children of matching parents)
    let nodeMatches = (parentMatches || searchPredicate(node, searchTerms));
    if (isLeaf(node, getNodeChildren)) {
      if (nodeMatches) {
        visibleLeaves.add(getNodeId(node));
      }
    }
    else {
      getNodeChildren(node).forEach(child => {
        addVisibleLeaves(child, nodeMatches);
      });
    }
  }
  addVisibleLeaves(tree, false);
  return (nodeId: string) => visibleLeaves.has(nodeId);
}

/**
 * Returns the stateful children of a node in a stateful tree.  Should be used
 * in lieu of the getNodeChildren prop when rendering the tree.
 */
function getStatefulChildren<T>(node: StatefulNode<T>) {
  return node.__expandableTreeChildren;
}

/**
 * Returns the state of a node in the stateful tree
 */
function getNodeState<T>(node: StatefulNode<T>) {
  return node.__expandableTreeState;
}

type State<T> = {
  isLeafVisible: (id: string) => boolean;
  generated: {
    statefulTree: StatefulNode<T>,
    expandedList: string[]
  };
};

/**
 * Expandable tree component
 */

export default function CheckboxTree<T> (props: Props<T>) {
    const { 
        tree, getNodeId, getNodeChildren, searchTerm, searchPredicate, selectedList, currentList, defaultList, isSearchable, isAdditionalFilterApplied,
        name, shouldExpandDescendantsWithOneChild, onExpansionChange, isSelectable, isMultiPick, onSelectionChange
    } = props;

    // create stateful isLeafVisible function based on props; this will be stored in state
    const isLeafVisible = useMemo(() => {
        return createIsLeafVisible(props)
    }, [tree, isSearchable, searchTerm, searchPredicate, isAdditionalFilterApplied]);

    // initialize stateful tree; this immutable tree structure will be replaced with each state change
    // const [ treeState, setTreeState ] = useState({
    //     isLeafVisible,
    //     generated: applyPropsToStatefulTree(createStatefulTree(tree, getNodeChildren), props, isLeafVisible, undefined),
    // });

    const generatedTreeState = useMemo(() => {
        if (isLeafVisible == null) return;
        return applyPropsToStatefulTree(createStatefulTree(tree, getNodeChildren), props, isLeafVisible, undefined)
    }, [tree, name, getNodeId, getNodeChildren, props.renderNode, isLeafVisible]);

    // define event handlers related to expansion
    const expandAll = createExpander({isLeafVisible, generated: generatedTreeState}, () => getBranches(tree, getNodeChildren).map(node => getNodeId(node)));
    const expandNone = createExpander({isLeafVisible, generated: generatedTreeState}, () => []);

    // define event handlers related to selection

    // add all nodes to selectedList
    const selectAll = createSelector({isLeafVisible, generated: generatedTreeState}, () =>
      getLeaves(tree, getNodeChildren).map(getNodeId));

    // remove all nodes from selectedList
    const selectNone = createSelector({isLeafVisible, generated: generatedTreeState}, () => []);

    // add visible nodes to selectedList
    const addVisible = createSelector({isLeafVisible, generated: generatedTreeState}, () =>
      Seq.from(selectedList)
        .concat(getLeaves(tree, getNodeChildren)
          .map(getNodeId)
          .filter(isLeafVisible))
        .uniq()
        .toArray());

    // set selected list to only visible nodes
    const selectOnlyVisible = createSelector({isLeafVisible, generated: generatedTreeState}, () =>
      getLeaves(tree, getNodeChildren)
      .map(getNodeId)
      .filter(isLeafVisible));

    // remove visible nodes from selectedList
    const removeVisible = createSelector({isLeafVisible, generated: generatedTreeState}, () =>
      selectedList
        .filter(nodeId => !isLeafVisible(nodeId)));


    const selectCurrentList = createSelector({isLeafVisible, generated: generatedTreeState}, () => currentList);
    const selectDefaultList = createSelector({isLeafVisible, generated: generatedTreeState}, () => defaultList);

    /**
    * Toggle expansion of the given node.  If node is a leaf, does nothing.
    */
    function toggleExpansion(node: T) {
        if (!generatedTreeState) return;
        if (!isActiveSearch(props) && !isLeaf(node, getNodeChildren)) {
        if (!shouldExpandDescendantsWithOneChild || generatedTreeState.expandedList.includes(getNodeId(node))) {
            // If "shouldExpandDescendantsWithOneChild" is not set to "true," or the node is already expanded,
            // simply addOrRemove the node to/from the expandedList
            onExpansionChange(addOrRemove(generatedTreeState.expandedList, getNodeId(node)));
        } else {
            // Otherwise, add the node and its descendants with one child to the expandedList
            let descendantNodesWithOneChild = _findDescendantsWithOneChild(node);

            let newExpandedList = Seq.from(generatedTreeState.expandedList)
            .concat(descendantNodesWithOneChild)
            .uniq()
            .toArray();

            onExpansionChange(newExpandedList);
        }
    }

    function _findDescendantsWithOneChild(descendant: T): Seq<string> {
      let nextNodes = getNodeId(node) === getNodeId(descendant) || getNodeChildren(descendant).length === 1
        ? Seq.from([ getNodeId(descendant) ])
        : Seq.empty();

      let remainingNodes = Seq.from(getNodeChildren(descendant)).flatMap(_findDescendantsWithOneChild);

      return nextNodes.concat(remainingNodes);
    }

    /**
   * Toggle selection of the given node.
   * If toggled checkbox is a selected leaf - add the leaf to the select list to be returned
   * If toggled checkbox is an unselected leaf - remove the leaf from the select list to be returned
   * If toggled checkbox is a selected non-leaf - identify the node's leaves and add them to the select list to be returned
   * If toggled checkbox is an unselected non-leaf - identify the node's leaves and remove them from the select list to be returned
   */
    function toggleSelection(node: T, selected: boolean) {
    if (!isSelectable) {
      return;
    }
    if (isLeaf(node, getNodeChildren)) {
      if (isMultiPick) {
        onSelectionChange(addOrRemove(selectedList, getNodeId(node)));
      }
      else {
        // radio button will only fire if changing from unselected -> selected;
        //   if single-pick, any event means only the clicked node is the new list
        onSelectionChange([ getNodeId(node) ]);
      }
    }
    else {
      let newSelectedList = (selectedList ? selectedList.slice() : []);
      let leafNodes = getLeaves(node, getNodeChildren);
      leafNodes.forEach(leafNode => {
        let leafId = getNodeId(leafNode);
        let index = newSelectedList.indexOf(leafId);
        if (selected && index === -1) {
          newSelectedList.push(leafId);
        }
        else if (!selected && index > -1) {
          newSelectedList.splice(index, 1);
        }
      });
      onSelectionChange(newSelectedList);
    }
  }

  function renderNode(node: T, path?: number[]) {
    return props.renderNode
      ? props.renderNode(node, path)
      : <span>{getNodeId(node)}</span>
  }
}
// export default class CheckboxTree<T> extends Component<Props<T>, State<T>> {

//   static LinkPlacement = LinksPosition;

//   static defaultProps = {
//     showRoot: false,
//     expandedList: null,
//     isSelectable: false,
//     selectedList: [],
//     customCheckboxes: {},
//     isMultiPick: true,
//     onSelectionChange: () => {},
//     isSearchable: false,
//     showSearchBox: true,
//     searchBoxPlaceholder: "Search...",
//     searchBoxHelp: '',
//     searchTerm: '',
//     onSearchTermChange: () => {},
//     searchPredicate: () => true,
//     linksPosition: LinksPosition.Both
//   };

//   expandAll: TreeLinkHandler;
//   expandNone: TreeLinkHandler;
//   selectAll: TreeLinkHandler;
//   selectNone: TreeLinkHandler;
//   addVisible: TreeLinkHandler;
//   removeVisible: TreeLinkHandler;
//   selectOnlyVisible: TreeLinkHandler;
//   selectCurrentList: TreeLinkHandler;
//   selectDefaultList: TreeLinkHandler;

//   /**
//    * Hards binds all the user interaction methods to this object.
//    * @param props - component properties
//    */
//   constructor(props: Props<T>) {
//     super(props);

//     // destructure props needed in this function
//     let { tree, getNodeId, getNodeChildren } = props;

//     // create stateful isLeafVisible function based on props; this will be stored in state
//     let isLeafVisible = createIsLeafVisible(props);

//     // initialize stateful tree; this immutable tree structure will be replaced with each state change
//     this.state = {
//       isLeafVisible: isLeafVisible,
//       generated: applyPropsToStatefulTree(createStatefulTree(tree, getNodeChildren), props, isLeafVisible, undefined)
//     };

//     // define event handlers related to expansion
//     this.expandAll = createExpander(this, () => getBranches(this.props.tree, getNodeChildren).map(node => getNodeId(node)));
//     this.expandNone = createExpander(this, () => []);
//     this.toggleExpansion = this.toggleExpansion.bind(this);

//     // define event handlers related to selection

//     // add all nodes to selectedList
//     this.selectAll = createSelector(this, () =>
//       getLeaves(this.props.tree, getNodeChildren).map(getNodeId))

//     // remove all nodes from selectedList
//     this.selectNone = createSelector(this, () => [])

//     // add visible nodes to selectedList
//     this.addVisible = createSelector(this, () =>
//       Seq.from(this.props.selectedList)
//         .concat(getLeaves(this.props.tree, getNodeChildren)
//           .map(getNodeId)
//           .filter(this.state.isLeafVisible))
//         .uniq()
//         .toArray());

//     // set selected list to only visible nodes
//     this.selectOnlyVisible = createSelector(this, () =>
//       getLeaves(this.props.tree, getNodeChildren)
//       .map(getNodeId)
//       .filter(this.state.isLeafVisible));

//     // remove visible nodes from selectedList
//     this.removeVisible = createSelector(this, () =>
//       this.props.selectedList
//         .filter(nodeId => !this.state.isLeafVisible(nodeId)));


//     this.selectCurrentList = createSelector(this, () => this.props.currentList);
//     this.selectDefaultList = createSelector(this, () => this.props.defaultList);
//     this.toggleSelection = this.toggleSelection.bind(this);
//     this.renderNode = this.renderNode.bind(this);
//   }

//   /**
//    * When new props are passed, the checkbox tree must apply them to the existing
//    * stateful tree to determine which nodes have changed due to changing props.
//    *
//    * Also if search-related props have changed, the isLeafVisible function must
//    * be regenerated so the currently-matching nodes are made visible.
//    */
//   componentWillReceiveProps(nextProps: Props<T>) {
//     let { tree, getNodeChildren, searchTerm, searchPredicate } = nextProps;

//     // create new isLeafVisible if relevant props have changed
//     let recreateIsLeafVisible = propsDiffer(this.props, nextProps,
//         ['tree', 'isSearchable', 'searchTerm', 'searchPredicate', 'isAdditionalFilterApplied']);
//     let isLeafVisible = (recreateIsLeafVisible ? createIsLeafVisible(nextProps) : this.state.isLeafVisible);

//     // if certain props have changed, then recreate stateful tree from scratch;
//     //     otherwise apply props to the existing tree to improve performance
//     let recreateGeneratedState = propsDiffer(this.props, nextProps,
//         [ 'tree', 'name', 'getNodeId', 'getNodeChildren', 'renderNode' ]);

//     this.setState({
//       isLeafVisible: isLeafVisible,
//       generated: applyPropsToStatefulTree(
//         recreateGeneratedState ? createStatefulTree(tree, getNodeChildren) : this.state.generated.statefulTree,
//         nextProps, isLeafVisible, this.state.generated.expandedList
//       )
//     });
//   }

//   /**
//    * Toggle expansion of the given node.  If node is a leaf, does nothing.
//    */
//   toggleExpansion(node: T) {
//     let { getNodeId, getNodeChildren, shouldExpandDescendantsWithOneChild } = this.props;
//     if (!isActiveSearch(this.props) && !isLeaf(node, getNodeChildren)) {
//       if (!shouldExpandDescendantsWithOneChild || this.state.generated.expandedList.includes(getNodeId(node))) {
//         // If "shouldExpandDescendantsWithOneChild" is not set to "true," or the node is already expanded,
//         // simply addOrRemove the node to/from the expandedList
//         this.props.onExpansionChange(addOrRemove(this.state.generated.expandedList, getNodeId(node)));
//       } else {
//         // Otherwise, add the node and its descendants with one child to the expandedList
//         let descendantNodesWithOneChild = _findDescendantsWithOneChild(node);

//         let newExpandedList = Seq.from(this.state.generated.expandedList)
//           .concat(descendantNodesWithOneChild)
//           .uniq()
//           .toArray();

//         this.props.onExpansionChange(newExpandedList);
//       }
//     }

//     function _findDescendantsWithOneChild(descendant: T): Seq<string> {
//       let nextNodes = getNodeId(node) === getNodeId(descendant) || getNodeChildren(descendant).length === 1
//         ? Seq.from([ getNodeId(descendant) ])
//         : Seq.empty();

//       let remainingNodes = Seq.from(getNodeChildren(descendant)).flatMap(_findDescendantsWithOneChild);

//       return nextNodes.concat(remainingNodes);
//     }
//   }

//   /**
//    * Toggle selection of the given node.
//    * If toggled checkbox is a selected leaf - add the leaf to the select list to be returned
//    * If toggled checkbox is an unselected leaf - remove the leaf from the select list to be returned
//    * If toggled checkbox is a selected non-leaf - identify the node's leaves and add them to the select list to be returned
//    * If toggled checkbox is an unselected non-leaf - identify the node's leaves and remove them from the select list to be returned
//    */
//   toggleSelection(node: T, selected: boolean) {
//     let { isSelectable, getNodeId, getNodeChildren, isMultiPick, selectedList, onSelectionChange } = this.props;
//     if (!isSelectable) {
//       return;
//     }
//     if (isLeaf(node, getNodeChildren)) {
//       if (isMultiPick) {
//         onSelectionChange(addOrRemove(selectedList, getNodeId(node)));
//       }
//       else {
//         // radio button will only fire if changing from unselected -> selected;
//         //   if single-pick, any event means only the clicked node is the new list
//         onSelectionChange([ getNodeId(node) ]);
//       }
//     }
//     else {
//       let newSelectedList = (selectedList ? selectedList.slice() : []);
//       let leafNodes = getLeaves(node, getNodeChildren);
//       leafNodes.forEach(leafNode => {
//         let leafId = getNodeId(leafNode);
//         let index = newSelectedList.indexOf(leafId);
//         if (selected && index === -1) {
//           newSelectedList.push(leafId);
//         }
//         else if (!selected && index > -1) {
//           newSelectedList.splice(index, 1);
//         }
//       });
//       onSelectionChange(newSelectedList);
//     }
//   }

//   renderNode(node: T, path?: number[]) {
//     return this.props.renderNode
//       ? this.props.renderNode(node, path)
//       : <span>{this.props.getNodeId(node)}</span>
//   }

//   /**
//    * Renders the expandable tree and related components
//    */
//   render() {
//     let {
//       name, showRoot, getNodeId, isSelectable, customCheckboxes, isMultiPick,
//       isSearchable, currentList, defaultList, showSearchBox, searchTerm,
//       searchBoxPlaceholder, searchBoxHelp, searchIconName,
//       linksPosition = LinksPosition.Both, additionalActions,
//       additionalFilters, isAdditionalFilterApplied, wrapTreeSection,
//       onSearchTermChange, autoFocusSearchBox, shouldExpandOnClick = true
//     } = this.props;
//     let topLevelNodes = (showRoot ? [ this.state.generated.statefulTree ] :
//       getStatefulChildren(this.state.generated.statefulTree));

//     let isTreeVisible = getNodeState(this.state.generated.statefulTree).isVisible;
//     let renderNoResults = this.props.renderNoResults || defaultRenderNoResults;
//     let noResultsMessage = isTreeVisible ? null : renderNoResults(searchTerm, this.props.tree);

//     let treeLinks = (
//       <TreeLinks
//         isFiltered={isFiltered(searchTerm, isAdditionalFilterApplied)}
//         selectAll={this.selectAll}
//         selectNone={this.selectNone}
//         addVisible={this.addVisible}
//         selectOnlyVisible={this.selectOnlyVisible}
//         removeVisible={this.removeVisible}
//         expandAll={this.expandAll}
//         expandNone={this.expandNone}
//         selectCurrentList={this.selectCurrentList}
//         selectDefaultList={this.selectDefaultList}
//         showSelectionLinks={!!isSelectable && !!isMultiPick}
//         showCurrentLink={currentList != null}
//         showDefaultLink={defaultList != null}
//         showExpansionLinks={!isActiveSearch(this.props)}
//         additionalActions={additionalActions}
//       />
//     );

//     let CheckboxTreeNodeT = (CheckboxTreeNode as new () => CheckboxTreeNode<StatefulNode<T>>);

//     let treeSection = (
//       <ul>
//       {topLevelNodes.map((node, index) => {
//         const nodeId = getNodeId(node);

//         return <CheckboxTreeNodeT
//           key={"node_" + nodeId}
//           name={name || ''}
//           node={node}
//           path={[index]}
//           getNodeState={getNodeState}
//           isSelectable={!!isSelectable}
//           isMultiPick={!!isMultiPick}
//           isActiveSearch={isActiveSearch(this.props)}
//           toggleSelection={this.toggleSelection}
//           toggleExpansion={this.toggleExpansion}
//           shouldExpandOnClick={shouldExpandOnClick}
//           getNodeId={getNodeId}
//           getNodeChildren={getStatefulChildren}
//           renderNode={this.renderNode}
//           customCheckboxes={customCheckboxes as unknown as CustomCheckboxes<StatefulNode<T>>} />
//   })}
//     </ul>
//     );

//     return (
//       <div>
//         {linksPosition & LinksPosition.Top ? treeLinks : null}
//         {!isSearchable || !showSearchBox ? "" : (
//           <div>
//             <RealTimeSearchBox
//               autoFocus={autoFocusSearchBox}
//               searchTerm={searchTerm}
//               onSearchTermChange={onSearchTermChange}
//               placeholderText={searchBoxPlaceholder}
//               iconName={searchIconName}
//               helpText={searchBoxHelp}
//             />
//             <AdditionalFilters
//               filters={additionalFilters}
//             />
//           </div>
//         )}
//         {noResultsMessage}
//         {wrapTreeSection ? wrapTreeSection(treeSection) : treeSection}
//         {linksPosition & LinksPosition.Bottom ? treeLinks : null}
//       </div>
//     );
//   }
// }

function defaultRenderNoResults() {
  return (
    <p>
      {/* <Icon type="warning"/>  */}
      The search term you entered did not yield any results.
    </p>
  );
}
