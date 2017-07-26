export interface Rule {
    [index: number]: string | RegExp | {[tag: string]: Rule;};
}

export interface IRuleSet {
    $begin: Rule;
    [ruleName: string]: Rule;
}

export interface IParseResult {
    [tagName: string]: string | any;
    [index: number]: string | any;
}

export type Action = ($: IParseResult) => any;

export interface IActionSet {
    [ruleName: string]: Action;
}

export interface IParserState {
    match: any;
    text: string;
    enableTrimSpace: boolean;
    taggedMatch: {[tagName: string]: any};
}

export interface IParserOption{
    verbose?: boolean;
    logFunc?: (message: string)=>void;
}

export class Parser {
    private ruleSet: IRuleSet;
    private actSet: IActionSet;
    private option: IParserOption;

    constructor(ruleSet: IRuleSet, actSet: IActionSet) {
        this.ruleSet = Object.assign({}, ruleSet);
        this.actSet = Object.assign({}, actSet);

        // If $space is omitted, the default $space is set.
        if (!this.ruleSet.$space) {
            this.ruleSet.$space = [/[ \t\r\n]*/];
        }
    }

    run(text: string, option?: IParserOption): any {
        const state: IParserState = {
            match: null,
            text: text,
            enableTrimSpace: true,
            taggedMatch: {}
        };

        const DEFAULT_OPTION: IParserOption = {
            verbose: false,
            logFunc: console.log
        };
        this.option = Object.assign(DEFAULT_OPTION, option);

        this.parse('$begin', state);
        return state.match;
    }

    private parse(rule: Rule, state: IParserState): boolean {
        // RegExp as Token rule.
        if (rule instanceof RegExp) {
            this.log('Token rule: ' + rule);

            if (state.enableTrimSpace) {
                state.enableTrimSpace = false;
                this.parse('$space', state);
                state.enableTrimSpace = true;
            }

            const matches = state.text.match(new RegExp(`^(${(rule as RegExp).source})`));
            if (!matches) {
                return false;
            }
            this.log('-> match: "' + matches[0] + '"');
            state.match = matches[0];
            state.text = state.text.slice(matches[0].length);
            return true;
        }
        // String as Reference rule.
        else if (typeof rule === 'string') {
            this.log('Reference rule: ' + rule);
            const backupTaggedMatch = state.taggedMatch;
            state.taggedMatch = {};
            const ruleList = this.ruleSet[rule as string];
            const isMatched = this.parse(ruleList, state);

            if (isMatched && this.actSet[rule as string]) {
                state.match = this.actSet[rule as string](Object.assign({}, state.match, state.taggedMatch));
            }

            state.taggedMatch = backupTaggedMatch;
            return isMatched;
        }
        // Array as Rule list.
        else if (rule instanceof Array) {
            this.log('Rule list: ' + rule);
            const resultList: any[] = [];
            rule.forEach(r => {
                if (!this.parse(r, state)) {
                    return false;
                }
                resultList.push(state.match);
            });
            state.match = resultList;
            return true;
        }
        // Object as tagged rule.
        else if (rule instanceof Object && Object.keys(rule).length === 1) {
            const tag = Object.keys(rule)[0];
            const taggedRule = (rule as any)[tag];
            this.log(`Tagged rule: {${tag}: ${taggedRule}}`);

            if (!this.parse(taggedRule, state)) {
                return false;
            }

            state.taggedMatch[tag] = state.match;
            return true;
        }

        this.log('Unknown rule: ' + rule);
        return false;
    }

    private log(message: string){
        if(this.option.verbose){
            this.option.logFunc(message);
        }
    }
}
