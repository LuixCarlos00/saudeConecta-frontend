import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { AuthService } from "src/app/core/services/auth.service";
import { tokenService } from "src/app/util/Token/Token.service";



@Injectable({ providedIn: 'root' })
export class GuardaRotasCadastroPaciente {
  constructor(private authService: AuthService,private router: Router,private tokeService: tokenService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree  {
    if (this.authService.hasToken()) {

      return true
    }else
   return false
  }
}
