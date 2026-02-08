import { analyzeHookLogic } from './logic/analyze_hook_logic';
import { responsiveSkillDefinition, responsiveHandler } from './ui/responsive_ui';
import { shadcnSkillDefinition, shadcnHandler } from './ui/shadcn_expert';
import { componentOptimizerSkillDefinition } from './infrastructure/component_optimizer';
import { formFactorySkillDefinition } from './logic/form_factory';
import { uiPolishSkillDefinition } from './ui/ui_polish';
import { dataFetchingSkillDefinition } from './logic/data_fetching';
import { feedbackSystemSkillDefinition } from './ui/feedback_system';
import { authGuardSkillDefinition } from './infrastructure/auth_guard';
import { aiCopywriterSkillDefinition } from './ui/ai_copywriter_ui';
import { routingMasterSkillDefinition } from './routing/routing_master';
import { searchParamsManagerSkillDefinition } from './routing/search_params_manager';
import { sitemapGeneratorSkillDefinition } from './routing/sitemap_generator';
import { authSessionManagerSkillDefinition } from './infrastructure/auth_session_manager';
import { tableGeneratorSkillDefinition } from './ui/table_generator';
import { toastNotificationSkillDefinition } from './ui/toast_notification';
import { skeletonLoaderSkillDefinition } from './ui/skeleton_loader';
import { themeSwitcherSkillDefinition } from './infrastructure/theme_switcher';
import { infiniteScrollSkillDefinition } from './logic/infinite_scroll';

export * from './logic/analyze_hook_logic';
export * from './ui/responsive_ui';
export * from './ui/shadcn_expert';
export * from './infrastructure/component_optimizer';
export * from './logic/form_factory';
export * from './ui/ui_polish';
export * from './logic/data_fetching';
export * from './ui/feedback_system';
export * from './infrastructure/auth_guard';
export * from './ui/ai_copywriter_ui';
export * from './routing/routing_master';
export * from './routing/search_params_manager';
export * from './routing/sitemap_generator';
export * from './infrastructure/auth_session_manager';
export * from './infrastructure/theme_switcher';
export * from './testing/component_test_builder';
export * from './testing/e2e_frontend_builder';
export * from './testing/hook_test_generator';
export * from './ui/table_generator';
export * from './ui/toast_notification';
export * from './ui/skeleton_loader';
export * from './logic/infinite_scroll';


export const frontendSkills = {
    definitions: [
        analyzeHookLogic,
        responsiveSkillDefinition,
        shadcnSkillDefinition,
        componentOptimizerSkillDefinition,
        formFactorySkillDefinition,
        uiPolishSkillDefinition,
        dataFetchingSkillDefinition,
        feedbackSystemSkillDefinition,
        authGuardSkillDefinition,
        aiCopywriterSkillDefinition,
        routingMasterSkillDefinition,
        searchParamsManagerSkillDefinition,
        sitemapGeneratorSkillDefinition,
        authSessionManagerSkillDefinition
    ],
    handlers: {
        [analyzeHookLogic.name]: analyzeHookLogic.handler,
        generate_responsive_layout: responsiveHandler,
        apply_shadcn_style: shadcnHandler,
        [componentOptimizerSkillDefinition.name]: componentOptimizerSkillDefinition.handler,
        [formFactorySkillDefinition.name]: formFactorySkillDefinition.handler,
        [uiPolishSkillDefinition.name]: uiPolishSkillDefinition.handler,
        [dataFetchingSkillDefinition.name]: dataFetchingSkillDefinition.handler,
        [feedbackSystemSkillDefinition.name]: feedbackSystemSkillDefinition.handler,
        [authGuardSkillDefinition.name]: authGuardSkillDefinition.handler,
        [aiCopywriterSkillDefinition.name]: aiCopywriterSkillDefinition.handler,
        [routingMasterSkillDefinition.name]: routingMasterSkillDefinition.handler,
        [searchParamsManagerSkillDefinition.name]: searchParamsManagerSkillDefinition.handler,
        [sitemapGeneratorSkillDefinition.name]: sitemapGeneratorSkillDefinition.handler,
        [authSessionManagerSkillDefinition.name]: authSessionManagerSkillDefinition.handler,
    }
};
