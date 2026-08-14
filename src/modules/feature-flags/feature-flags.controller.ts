import { Controller, Get, Patch, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { readFeatureFlags, writeFeatureFlags } from '../../utils/feature-flags.util';
import { UsersService } from '../users/users.service';

@ApiTags('Feature Flags')
@Controller({ path: 'feature-flags', version: '1' })
export class FeatureFlagsController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    async getFlags() {
        return readFeatureFlags();
    }

    @Patch()
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    async updateFlags(@Request() req) {
        const body = req.body;
        const user = await this.usersService.findOneFull({ id: req.user.id });
        const isSuperAdmin =
            user?.employeePosition?.grant_all_access === true ||
            user?.employee_position_id === 1 ||
            String(user?.employee_position_id) === '1';

        if (!isSuperAdmin) {
            throw new HttpException('Only Super Admin can change feature flags', HttpStatus.FORBIDDEN);
        }

        writeFeatureFlags(body);
        return readFeatureFlags();
    }
}
